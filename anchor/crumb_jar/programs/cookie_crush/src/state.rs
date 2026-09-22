use anchor_lang::prelude::*;

/// An in-progress level attempt. Created by start_level, closed by
/// submit_score, so a player can only have one open attempt per level.
#[account]
#[derive(InitSpace)]
pub struct Session {
    pub player: Pubkey,
    pub level_id: u8,
    pub started_at: i64,
    pub bump: u8,
    /// Whether the player paid $CRUMB for a longer round. Recorded so the
    /// purchase is visible on chain, not because the clock is enforced here.
    pub boosted: bool,
}

/// A player's running record for one level. Persists across attempts.
#[account]
#[derive(InitSpace)]
pub struct LevelScore {
    pub player: Pubkey,
    pub level_id: u8,
    pub best_score: u32,
    pub attempts: u32,
    pub bump: u8,
}
