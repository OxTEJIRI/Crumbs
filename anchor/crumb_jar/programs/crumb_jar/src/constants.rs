use anchor_lang::prelude::*;

#[constant]
pub const JAR_SEED: &[u8] = b"cookie_jar";

#[constant]
pub const RAID_SEED: &[u8] = b"raid";

/// Tuned for a fast, replayable feel: a claim after even a short session
/// banks a satisfying number instead of a trickle.
#[constant]
pub const BASE_PRODUCTION_RATE: u64 = 20;

/// Staked by the attacker at commit time and forfeited on a loss. Taking it
/// up front means walking away from an unfavourable reveal costs the same as
/// losing, so there is no reason to abandon a raid. Scaled with
/// BASE_PRODUCTION_RATE so it stays roughly "a few seconds of accrual," not
/// trivial and not crushing.
#[constant]
pub const RAID_STAKE: u64 = 100;

#[constant]
pub const RAID_STEAL_PERCENT: u64 = 20;

/// Short enough that a player can raid again right away rather than being
/// locked out for minutes — the whole point of a game you want to replay.
#[constant]
pub const RAID_COOLDOWN_SECONDS: i64 = 30;

#[constant]
pub const BASE_RAID_SUCCESS_PERCENT: u64 = 70;

#[constant]
pub const DEFENSE_REDUCTION_PER_LEVEL: u64 = 5;

/// `SysvarS1otHashes111111111111111111111111111`
#[constant]
pub const SLOT_HASHES_ID: Pubkey = pubkey!("SysvarS1otHashes111111111111111111111111111");
