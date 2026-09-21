use anchor_lang::prelude::*;
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
pub fn handle_start_round(ctx: Context<StartRound>) -> Result<()> {
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

    let round = &mut ctx.accounts.round;
    round.player = stats.player;
    round.target_bps = target_bps;
    round.start_slot = clock.slot;
    round.bump = ctx.bumps.round;

    msg!(
        "Round started, target {}bps, sampled from slot {}",
        target_bps,
        slot
    );
    Ok(())
}
