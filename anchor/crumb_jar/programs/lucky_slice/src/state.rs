use anchor_lang::prelude::*;

/// An in-progress round. Created by start_round (which also rolls the
/// target), closed by submit_cut, so a player can only have one open round
/// at a time.
#[account]
#[derive(InitSpace)]
pub struct Round {
    pub player: Pubkey,
    pub target_bps: u32,
    pub start_slot: u64,
    pub bump: u8,
    /// Whether crumbs are escrowed against this round. submit_cut has to know
    /// without being told, so a player can't quietly settle a staked round as
    /// if it were a free one.
    pub wagered: bool,
}

/// One per player, created on their first round and reused for every one
/// after. `best_accuracy_bps` is the leaderboard stat: 10_000 means a
/// perfect cut, 0 means as far from the target as possible. `attempts`
/// doubles as the target's randomness nonce.
#[account]
#[derive(InitSpace)]
pub struct SliceStats {
    pub player: Pubkey,
    pub best_accuracy_bps: u32,
    pub attempts: u64,
    pub last_slot: u64,
    pub bump: u8,
}
