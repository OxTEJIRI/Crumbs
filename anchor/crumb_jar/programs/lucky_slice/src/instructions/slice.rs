use anchor_lang::prelude::*;
use solana_sha256_hasher::hashv;

use crate::{constants::*, error::LuckySliceError, state::SliceStats};

#[derive(Accounts)]
pub struct Slice<'info> {
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

/// There's nothing at stake here, so — unlike the raid's commit-reveal —
/// this is a single transaction. The slot hash alone would let a player
/// simulate ahead and only broadcast a favorable outcome for the *next*
/// slot, so the player's own key and their running attempt count are mixed
/// in too: neither is something the caller can change to search for a
/// better roll without actually spending a transaction on each attempt.
pub fn handle_slice(ctx: Context<Slice>) -> Result<()> {
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
    let cut_bps = (roll % (BPS_DENOMINATOR as u64 + 1)) as u32;

    stats.attempts = stats.attempts.saturating_add(1);
    stats.last_slot = clock.slot;
    if cut_bps > stats.best_cut_bps {
        stats.best_cut_bps = cut_bps;
    }

    msg!(
        "Sliced for {}bps (best so far {}bps), sampled from slot {}",
        cut_bps,
        stats.best_cut_bps,
        slot
    );
    Ok(())
}
