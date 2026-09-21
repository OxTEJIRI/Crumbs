use anchor_lang::prelude::*;

#[constant]
pub const STATS_SEED: &[u8] = b"slice";

/// Cut size is tracked in basis points (0–10_000, i.e. 0%–100%) rather than
/// a percentage, so the on-chain math never needs to round a fraction.
#[constant]
pub const BPS_DENOMINATOR: u32 = 10_000;

pub const SLOT_HASHES_ID: Pubkey = pubkey!("SysvarS1otHashes111111111111111111111111111");
