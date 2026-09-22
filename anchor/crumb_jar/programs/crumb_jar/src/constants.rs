use anchor_lang::prelude::*;

#[constant]
pub const JAR_SEED: &[u8] = b"cookie_jar";

#[constant]
pub const RAID_SEED: &[u8] = b"raid";

/// A single global PDA, not per-jar, since an SPL mint can only have one
/// mint authority pubkey. Every jar's own token account is still authorized
/// by that jar's own PDA (for moving crumbs it already holds, as raids do);
/// this one is only ever used to sign the mint_to CPI that creates new
/// crumbs in the first place.
#[constant]
pub const MINT_AUTHORITY_SEED: &[u8] = b"crumb_mint_authority";

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

/// The real $CRUMB SPL Token mint. 0 decimals: crumbs have always been
/// whole numbers, so this keeps every existing balance and UI display
/// exactly as-is.
///
/// TODO(before mainnet use): this mint hasn't been created on Cookie Chain
/// yet, only locally for testing -- see target/deploy/crumb-mint-keypair.json
/// (gitignored, same as every other program keypair). Creating it for real
/// is a separate, deliberate step from deploying this program upgrade.
#[constant]
pub const CRUMB_MINT: Pubkey = pubkey!("9Fj8joWNECtUdB74S2Y5odrUUj9pukuLak3ouQDjgCbS");
