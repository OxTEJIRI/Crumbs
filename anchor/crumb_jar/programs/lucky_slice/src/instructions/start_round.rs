use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use crumb_jar::{cpi::accounts::EscrowCrumbs, program::CrumbJar, state::CookieJar};
use solana_sha256_hasher::hashv;

use crate::{constants::*, error::LuckySliceError, state::{Round, SliceStats}};

#[derive(Accounts)]
pub struct StartRound<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        init_if_needed,
        payer = player,
        space = 8 + SliceStats::INIT_SPACE,
        seeds = [STATS_SEED, player.key().as_ref()],
        bump
    )]
    pub stats: Account<'info, SliceStats>,
    #[account(
        init,
        payer = player,
        space = 8 + Round::INIT_SPACE,
        seeds = [ROUND_SEED, player.key().as_ref()],
        bump
    )]
    pub round: Account<'info, Round>,
    /// CHECK: address-checked against the SlotHashes sysvar and read as raw
    /// bytes, because the sysvar is far too large to deserialize on-chain.
    #[account(address = SLOT_HASHES_ID)]
    pub slot_hashes: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,

    // Everything below is only needed to stake a round. Optional, so playing
    // for free never requires owning a Cookie Jar.
    pub jar: Option<Account<'info, CookieJar>>,
    pub crumb_mint: Option<Account<'info, Mint>>,
    #[account(mut)]
    pub jar_crumbs: Option<Account<'info, TokenAccount>>,
    /// Held by the round itself, so only this program can settle it, and only
    /// once the cut is in.
    #[account(
        init_if_needed,
        payer = player,
        associated_token::mint = crumb_mint,
        associated_token::authority = round,
    )]
    pub wager_escrow: Option<Account<'info, TokenAccount>>,
    pub crumb_jar_program: Option<Program<'info, CrumbJar>>,
    pub token_program: Option<Program<'info, Token>>,
    pub associated_token_program: Option<Program<'info, AssociatedToken>>,
}

/// Reads the most recent (slot, hash) pair from the SlotHashes sysvar. Layout
/// is an 8-byte little-endian count followed by 40-byte entries of
/// (slot: u64, hash: [u8; 32]), ordered newest first.
fn most_recent_slot_hash(data: &[u8]) -> Result<(u64, [u8; 32])> {
    require!(data.len() >= 48, LuckySliceError::SlotHashUnavailable);

    let count = u64::from_le_bytes(data[0..8].try_into().unwrap());
    require!(count > 0, LuckySliceError::SlotHashUnavailable);

    let slot = u64::from_le_bytes(data[8..16].try_into().unwrap());
    let hash: [u8; 32] = data[16..48].try_into().unwrap();

    Ok((slot, hash))
}

/// The target is rolled on-chain, not chosen by the client, so a player
/// can't simply keep re-rolling until an easy target shows up without it
/// costing a real transaction each time. The actual cut is up to the
/// player's own timing and is recorded later by submit_cut.
pub fn handle_start_round(ctx: Context<StartRound>, wager: bool) -> Result<()> {
    let clock = Clock::get()?;
    let (slot, slot_hash) = most_recent_slot_hash(&ctx.accounts.slot_hashes.data.borrow())?;

    let stats = &mut ctx.accounts.stats;
    if stats.player == Pubkey::default() {
        stats.player = ctx.accounts.player.key();
        stats.bump = ctx.bumps.stats;
    }

    let roll = u64::from_le_bytes(
        hashv(&[
            stats.player.as_ref(),
            &stats.attempts.to_le_bytes(),
            &slot_hash,
        ])
        .to_bytes()[0..8]
            .try_into()
            .unwrap(),
    );
    let target_bps = (roll % (BPS_DENOMINATOR as u64 + 1)) as u32;

    let player_key = ctx.accounts.player.key();
    let round_bump = ctx.bumps.round;

    let round = &mut ctx.accounts.round;
    round.player = stats.player;
    round.target_bps = target_bps;
    round.start_slot = clock.slot;
    round.bump = round_bump;
    round.wagered = wager;

    if wager {
        let (jar, crumb_mint, jar_crumbs, wager_escrow, crumb_jar_program, token_program) = match (
            &ctx.accounts.jar,
            &ctx.accounts.crumb_mint,
            &ctx.accounts.jar_crumbs,
            &ctx.accounts.wager_escrow,
            &ctx.accounts.crumb_jar_program,
            &ctx.accounts.token_program,
        ) {
            (Some(a), Some(b), Some(c), Some(d), Some(e), Some(f)) => (a, b, c, d, e, f),
            _ => return err!(LuckySliceError::WagerAccountsMissing),
        };

        // The round PDA signs as the escrow's authority, which is how
        // crumb_jar knows the crumbs are going somewhere a program holds
        // rather than straight back to the player.
        let seeds: &[&[u8]] = &[ROUND_SEED, player_key.as_ref(), &[round_bump]];
        let signer_seeds: &[&[&[u8]]] = &[seeds];

        let cpi_accounts = EscrowCrumbs {
            owner: ctx.accounts.player.to_account_info(),
            jar: jar.to_account_info(),
            crumb_mint: crumb_mint.to_account_info(),
            jar_crumbs: jar_crumbs.to_account_info(),
            escrow: wager_escrow.to_account_info(),
            escrow_authority: ctx.accounts.round.to_account_info(),
            token_program: token_program.to_account_info(),
        };
        let cpi_ctx =
            CpiContext::new_with_signer(crumb_jar_program.key(), cpi_accounts, signer_seeds);
        crumb_jar::cpi::escrow_crumbs(cpi_ctx, WAGER_STAKE_CRUMBS)?;
    }

    msg!(
        "Round started, target {}bps, sampled from slot {}{}",
        target_bps,
        slot,
        if wager { " (staked)" } else { "" }
    );
    Ok(())
}
