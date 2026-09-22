use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Burn, CloseAccount, Mint, MintTo, Token, TokenAccount, Transfer},
};
use solana_sha256_hasher::hashv;

use crate::{constants::*, error::CrumbJarError, state::{CookieJar, Raid}};

#[derive(Accounts)]
pub struct RevealRaid<'info> {
    #[account(mut)]
    pub attacker: Signer<'info>,
    #[account(
        seeds = [JAR_SEED, attacker.key().as_ref()],
        bump = attacker_jar.bump
    )]
    pub attacker_jar: Account<'info, CookieJar>,
    #[account(
        mut,
        seeds = [JAR_SEED, target_jar.owner.as_ref()],
        bump = target_jar.bump
    )]
    pub target_jar: Account<'info, CookieJar>,
    #[account(
        mut,
        close = attacker,
        seeds = [RAID_SEED, attacker.key().as_ref()],
        bump = raid.bump
    )]
    pub raid: Account<'info, Raid>,
    /// Mutable because a lost raid burns the stake, and a won one first mints
    /// the target's pending accrual -- both move the mint's own supply figure.
    #[account(mut, address = CRUMB_MINT)]
    pub crumb_mint: Account<'info, Mint>,
    /// CHECK: a pure signing authority, verified by the seeds constraint.
    #[account(seeds = [MINT_AUTHORITY_SEED], bump)]
    pub mint_authority: UncheckedAccount<'info>,
    #[account(
        mut,
        associated_token::mint = crumb_mint,
        associated_token::authority = attacker_jar,
    )]
    pub attacker_crumbs: Account<'info, TokenAccount>,
    /// `init_if_needed` because a target who has never claimed has no token
    /// account yet. Without this the reveal would fail forever, and since the
    /// stake is already escrowed and the raid PDA is seeded per-attacker, that
    /// would strand the stake and lock the attacker out of raiding entirely.
    #[account(
        init_if_needed,
        payer = attacker,
        associated_token::mint = crumb_mint,
        associated_token::authority = target_jar,
    )]
    pub target_crumbs: Account<'info, TokenAccount>,
    /// Pinned to the raid PDA's own associated account so a substituted
    /// empty one can't be passed in to leave the real stake orphaned once
    /// the raid account closes.
    #[account(
        mut,
        associated_token::mint = crumb_mint,
        associated_token::authority = raid,
    )]
    pub raid_escrow: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    /// CHECK: address-checked against the SlotHashes sysvar and read as raw
    /// bytes, because the sysvar is far too large to deserialize on-chain.
    #[account(address = SLOT_HASHES_ID)]
    pub slot_hashes: UncheckedAccount<'info>,
}

/// Reads the most recent (slot, hash) pair from the SlotHashes sysvar. Layout
/// is an 8-byte little-endian count followed by 40-byte entries of
/// (slot: u64, hash: [u8; 32]), ordered newest first.
fn most_recent_slot_hash(data: &[u8]) -> Result<(u64, [u8; 32])> {
    require!(data.len() >= 48, CrumbJarError::SlotHashUnavailable);

    let count = u64::from_le_bytes(data[0..8].try_into().unwrap());
    require!(count > 0, CrumbJarError::SlotHashUnavailable);

    let slot = u64::from_le_bytes(data[8..16].try_into().unwrap());
    let hash: [u8; 32] = data[16..48].try_into().unwrap();

    Ok((slot, hash))
}

pub fn handle_reveal_raid(ctx: Context<RevealRaid>, secret: [u8; 32]) -> Result<()> {
    require!(
        ctx.accounts.target_jar.migrated,
        CrumbJarError::NotMigrated
    );

    let raid = &ctx.accounts.raid;
    let attacker_key = ctx.accounts.attacker.key();

    require_keys_eq!(
        ctx.accounts.target_jar.key(),
        raid.target,
        CrumbJarError::WrongTarget
    );

    // Binding the attacker into the commitment stops anyone else from
    // front-running the reveal with a secret they observed in the mempool.
    let expected = hashv(&[&secret, attacker_key.as_ref()]).to_bytes();
    require!(expected == raid.commitment, CrumbJarError::InvalidReveal);

    // The attacker picks the secret, so on its own it decides nothing — they
    // would simply never reveal a loss. Mixing in a slot hash minted after the
    // commit makes the outcome unknowable until it is too late to back out.
    let (slot, slot_hash) = most_recent_slot_hash(&ctx.accounts.slot_hashes.data.borrow())?;
    require!(slot > raid.commit_slot, CrumbJarError::RevealTooSoon);

    let roll = u64::from_le_bytes(
        hashv(&[&secret, &slot_hash]).to_bytes()[0..8]
            .try_into()
            .unwrap(),
    ) % 100;

    let raid_key = raid.key();
    let raid_bump = raid.bump;
    let raid_seeds: &[&[u8]] = &[RAID_SEED, attacker_key.as_ref(), &[raid_bump]];
    let raid_signer: &[&[&[u8]]] = &[raid_seeds];

    let threshold = BASE_RAID_SUCCESS_PERCENT.saturating_sub(
        (ctx.accounts.target_jar.defense_level as u64).saturating_mul(DEFENSE_REDUCTION_PER_LEVEL),
    );
    let succeeded = roll < threshold;

    let looted = if succeeded {
        // Pre-migration this was `settle()`, banking the target's accrual into
        // the legacy u64 before the steal was computed. The equivalent now is
        // minting it for real, so a raid still reaches everything the target
        // has earned. Skipping it would make never claiming a way to sit on an
        // unbounded, permanently raid-proof balance.
        let now = Clock::get()?.unix_timestamp;
        let accrued = ctx.accounts.target_jar.accrued(now);
        ctx.accounts.target_jar.last_claimed_ts = now;

        if accrued > 0 {
            let mint_bump = ctx.bumps.mint_authority;
            let mint_seeds: &[&[u8]] = &[MINT_AUTHORITY_SEED, &[mint_bump]];
            let mint_signer: &[&[&[u8]]] = &[mint_seeds];

            let cpi_accounts = MintTo {
                mint: ctx.accounts.crumb_mint.to_account_info(),
                to: ctx.accounts.target_crumbs.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                anchor_spl::token::ID,
                cpi_accounts,
                mint_signer,
            );
            token::mint_to(cpi_ctx, accrued)?;
        }

        // The cached deserialization predates that mint, so fold it in by hand
        // rather than paying for a reload.
        let target_total = ctx.accounts.target_crumbs.amount.saturating_add(accrued);
        let stolen = target_total.saturating_mul(RAID_STEAL_PERCENT) / 100;

        if stolen > 0 {
            let target_owner = ctx.accounts.target_jar.owner;
            let target_bump = ctx.accounts.target_jar.bump;
            let target_seeds: &[&[u8]] = &[JAR_SEED, target_owner.as_ref(), &[target_bump]];
            let target_signer: &[&[&[u8]]] = &[target_seeds];

            let cpi_accounts = Transfer {
                from: ctx.accounts.target_crumbs.to_account_info(),
                to: ctx.accounts.attacker_crumbs.to_account_info(),
                authority: ctx.accounts.target_jar.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                anchor_spl::token::ID,
                cpi_accounts,
                target_signer,
            );
            token::transfer(cpi_ctx, stolen)?;
        }

        // Winning returns the stake alongside the loot.
        let cpi_accounts = Transfer {
            from: ctx.accounts.raid_escrow.to_account_info(),
            to: ctx.accounts.attacker_crumbs.to_account_info(),
            authority: ctx.accounts.raid.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            anchor_spl::token::ID,
            cpi_accounts,
            raid_signer,
        );
        token::transfer(cpi_ctx, ctx.accounts.raid_escrow.amount)?;

        stolen
    } else {
        // Losing forfeits the stake entirely -- burned, not handed to the
        // target, matching how a lost stake already just vanished from the
        // old u64 accounting rather than crediting anyone.
        let cpi_accounts = Burn {
            mint: ctx.accounts.crumb_mint.to_account_info(),
            from: ctx.accounts.raid_escrow.to_account_info(),
            authority: ctx.accounts.raid.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            anchor_spl::token::ID,
            cpi_accounts,
            raid_signer,
        );
        token::burn(cpi_ctx, ctx.accounts.raid_escrow.amount)?;
        0
    };

    // The escrow is empty either way now -- reclaim its rent to the attacker,
    // same as the raid account itself already does.
    let cpi_accounts = CloseAccount {
        account: ctx.accounts.raid_escrow.to_account_info(),
        destination: ctx.accounts.attacker.to_account_info(),
        authority: ctx.accounts.raid.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        anchor_spl::token::ID,
        cpi_accounts,
        raid_signer,
    );
    token::close_account(cpi_ctx)?;

    msg!(
        "Raid {} (roll {} vs threshold {}), looted {} crumbs [{}]",
        if succeeded { "succeeded" } else { "failed" },
        roll,
        threshold,
        looted,
        raid_key
    );
    Ok(())
}
