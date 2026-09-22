use anchor_lang::prelude::*;

#[constant]
pub const ROUND_SEED: &[u8] = b"round";

#[constant]
pub const STATS_SEED: &[u8] = b"slice";

/// Cut size and accuracy are tracked in basis points (0–10_000, i.e.
/// 0%–100%) rather than a percentage, so the on-chain math never needs to
/// round a fraction.
#[constant]
pub const BPS_DENOMINATOR: u32 = 10_000;

/// The knife's timing is client-side gameplay the chain can't watch, the
/// same way Cookie Crush's board is — so, like Cookie Crush, this is a
/// loose plausibility floor, not real anti-cheat: submitting in the same
/// slot the round started would mean no actual tap happened in between.
#[constant]
pub const MIN_ROUND_SLOTS: u64 = 1;

pub const SLOT_HASHES_ID: Pubkey = pubkey!("SysvarS1otHashes111111111111111111111111111");

/// What a staked round puts at risk. Smaller than Cookie Crush's boost,
/// because a round is over in seconds and a player will take many of them.
#[constant]
pub const WAGER_STAKE_CRUMBS: u64 = 150;

/// The accuracy a staked round has to reach to get the stake back. Well
/// above what a careless tap lands, but comfortably reachable with a
/// deliberate one, so the stake rewards precision rather than luck.
#[constant]
pub const WAGER_ACCURACY_BPS: u32 = 8_500;
