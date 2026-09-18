use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct CookieJar {
    pub owner: Pubkey,
    pub crumb_balance: u64,
    pub production_rate: u64,
    pub last_claimed_ts: i64,
    pub defense_level: u8,
    pub bump: u8,
}
