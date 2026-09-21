use anchor_lang::prelude::*;

/// One per player, created on their first slice and reused for every one
/// after. `best_cut_bps` is the leaderboard stat; `attempts` doubles as the
/// randomness nonce, so two slices in the same slot never hash to the same
/// input.
#[account]
#[derive(InitSpace)]
pub struct SliceStats {
    pub player: Pubkey,
    pub best_cut_bps: u32,
    pub attempts: u64,
    pub last_slot: u64,
    pub bump: u8,
}
