use anchor_lang::prelude::*;
use solana_sha256_hasher::hashv;

use crate::{constants::*, error::CrumbJarError, state::{CookieJar, Raid}};

#[derive(Accounts)]
pub struct RevealRaid<'info> {
    #[account(mut)]
    pub attacker: Signer<'info>,
    #[account(
        mut,
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

    let now = Clock::get()?.unix_timestamp;
    let target_jar = &mut ctx.accounts.target_jar;

    // Settle the victim so a raid hits everything they have earned, not just
    // the crumbs they happened to have claimed.
    target_jar.settle(now);

    let threshold = BASE_RAID_SUCCESS_PERCENT.saturating_sub(
        (target_jar.defense_level as u64).saturating_mul(DEFENSE_REDUCTION_PER_LEVEL),
    );
    let succeeded = roll < threshold;

    let looted = if succeeded {
        let stolen = target_jar
            .crumb_balance
            .saturating_mul(RAID_STEAL_PERCENT)
            / 100;
        target_jar.crumb_balance -= stolen;
        stolen
    } else {
        0
    };

    let attacker_jar = &mut ctx.accounts.attacker_jar;
    attacker_jar.settle(now);

    if succeeded {
        // Winning returns the stake alongside the loot; losing forfeits it.
        attacker_jar.crumb_balance = attacker_jar
            .crumb_balance
            .saturating_add(raid.staked)
            .saturating_add(looted);
    }

    msg!(
        "Raid {} (roll {} vs threshold {}), looted {} crumbs",
        if succeeded { "succeeded" } else { "failed" },
        roll,
        threshold,
        looted
    );
    Ok(())
}
