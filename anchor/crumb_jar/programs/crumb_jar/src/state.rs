use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct CookieJar {
    pub owner: Pubkey,
    pub crumb_balance: u64,
    pub production_rate: u64,
    pub last_claimed_ts: i64,
    pub last_raid_ts: i64,
    pub defense_level: u8,
    pub bump: u8,
}

impl CookieJar {
    /// Folds the crumbs accrued since the last settlement into the balance.
    /// Raids settle the target first so that stealing hits everything the
    /// victim has earned, not just what they bothered to claim.
    pub fn settle(&mut self, now: i64) -> u64 {
        // A validator's clock can drift backwards across slots, so treat any
        // negative interval as zero rather than underflowing.
        let elapsed = now.saturating_sub(self.last_claimed_ts).max(0) as u64;
        let accrued = elapsed.saturating_mul(self.production_rate);

        self.crumb_balance = self.crumb_balance.saturating_add(accrued);
        self.last_claimed_ts = now;

        accrued
    }
}

/// An in-flight raid. Created at commit, closed at reveal, and seeded on the
/// attacker so a player can only have one raid open at a time.
#[account]
#[derive(InitSpace)]
pub struct Raid {
    pub attacker: Pubkey,
    pub target: Pubkey,
    pub commitment: [u8; 32],
    pub commit_slot: u64,
    pub staked: u64,
    pub bump: u8,
}
