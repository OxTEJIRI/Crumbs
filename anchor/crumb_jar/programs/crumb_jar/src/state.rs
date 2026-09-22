use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct CookieJar {
    pub owner: Pubkey,
    /// Legacy balance from before $CRUMB became a real SPL token. Only ever
    /// written to pre-migration; frozen (and zeroed once spent) afterward.
    /// Cannot be removed or reordered -- every already-minted jar on-chain
    /// has this exact byte layout baked in, and Borsh deserializes
    /// positionally, so doing either would corrupt every existing account.
    pub crumb_balance: u64,
    pub production_rate: u64,
    pub last_claimed_ts: i64,
    pub last_raid_ts: i64,
    pub defense_level: u8,
    pub bump: u8,
    /// Appended field, not inserted -- new fields must only ever go at the
    /// end for the same reason `crumb_balance` can't move. False on every
    /// jar that existed before this field did (realloc zero-initializes new
    /// space), true immediately for jars minted after, since they start
    /// with nothing to migrate.
    pub migrated: bool,
}

impl CookieJar {
    /// Folds the crumbs accrued since the last settlement into the legacy
    /// balance. Only meaningful pre-migration; real accrual after that
    /// mints directly, since accrued() below has already superseded this
    /// for migrated jars.
    pub fn settle(&mut self, now: i64) -> u64 {
        // A validator's clock can drift backwards across slots, so treat any
        // negative interval as zero rather than underflowing.
        let elapsed = now.saturating_sub(self.last_claimed_ts).max(0) as u64;
        let accrued = elapsed.saturating_mul(self.production_rate);

        self.crumb_balance = self.crumb_balance.saturating_add(accrued);
        self.last_claimed_ts = now;

        accrued
    }

    /// What's accrued since the last claim, without banking it -- used by
    /// the post-migration claim path, which mints this directly rather than
    /// adding it to crumb_balance.
    pub fn accrued(&self, now: i64) -> u64 {
        let elapsed = now.saturating_sub(self.last_claimed_ts).max(0) as u64;
        elapsed.saturating_mul(self.production_rate)
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
