use anchor_lang::prelude::*;

#[constant]
pub const OVEN_SEED: &[u8] = b"oven";

/// Denominator for every basis-point percentage below (payout share, jar
/// share, damage range). Numerically the same as MAX_HP/MAX_HEAT, but kept
/// as its own name since it means something different: "out of 100%," not
/// "out of a full cookie."
#[constant]
pub const BPS_DENOMINATOR: u32 = 10_000;

/// HP and heat are tracked in basis points (0–10_000) rather than a
/// percentage, so integer math never needs to round a fraction.
#[constant]
pub const MAX_HP: u32 = 10_000;

#[constant]
pub const MAX_HEAT: u32 = 10_000;

#[constant]
pub const MIN_BAKE_LAMPORTS: u64 = 50_000_000; // 0.05 COOK

#[constant]
pub const MIN_NIBBLE_LAMPORTS: u64 = 1_000_000; // 0.001 COOK

/// Baker cannot nibble their own cookie until this many slots after bake —
/// stops bake-and-self-eat in the same breath. Self-nibbling afterward is
/// harmless: PAYOUT_BPS < 10_000 means every bite is net-negative for
/// whoever pays for it, self included, so there's nothing to exploit.
#[constant]
pub const BAKER_LOCK_SLOTS: u64 = 8;

/// How long the cookie can sit untouched before it starts cooking on its own.
#[constant]
pub const IDLE_SLOTS: u64 = 15;

/// Flat heat added per idle window left unattended.
#[constant]
pub const IDLE_HEAT: u32 = 2_500;

/// Damage curve: damage = D_MIN + (D_MAX - D_MIN) * bid / (bid + K * hp).
/// Small bids chip; huge bids do more but with diminishing returns, so no
/// single transaction can one-shot a healthy cookie. K is tuned so a
/// ~0.05 COOK bid against a full-health cookie lands near the curve's
/// midpoint — see `damage_bps` for the exact arithmetic.
#[constant]
pub const DAMAGE_MIN_BPS: u32 = 300;

#[constant]
pub const DAMAGE_MAX_BPS: u32 = 3_000;

#[constant]
pub const DAMAGE_K: u64 = 5_000;

/// Share of the (post-bid) pot paid to the nibbler, proportional to the
/// damage fraction they just dealt. The rest stays in the pot for the next
/// bite, the eventual winner, or the jar. Below 10_000 so nibbling — even
/// nibbling your own cookie after the lock — is never a free lunch.
#[constant]
pub const PAYOUT_SHARE_BPS: u32 = 6_000;

/// Heat added per nibble: a flat cost plus a share proportional to the
/// damage just dealt, so aggressive bites heat the oven faster than gentle
/// ones.
#[constant]
pub const HEAT_BASE: u32 = 100;

#[constant]
pub const HEAT_SCALE: u32 = 2_000;

/// Protocol cut on every ending (eaten or pulled) and on the full pot when a
/// cookie burns from neglect.
#[constant]
pub const JAR_SHARE_BPS: u32 = 200;

/// Glaze always removes this much heat and restores this much HP, for a
/// cost that grows with heat squared — cheap early, a panic spend late.
#[constant]
pub const GLAZE_HEAT_REDUCTION: u32 = 2_000;

#[constant]
pub const GLAZE_HP_RESTORE: u32 = 500;

#[constant]
pub const GLAZE_BASE_COST_LAMPORTS: u64 = 5_000_000; // 0.005 COOK

#[constant]
pub const GLAZE_HEAT_DIVISOR: u64 = 20;

/// Cookie Chain's community treasury — takes the protocol cut on every
/// ending and the entire pot when a cookie burns. Off-curve and
/// system-owned, so it has no private key and is only ever credited, never
/// a signer. It already holds far more than the rent-exempt minimum, so
/// even the smallest possible cut lands without a rent failure.
#[constant]
pub const JAR_ADDRESS: Pubkey = pubkey!("568tU9FMksJDxjkLBjWisSA4J4C5uPH87NCCkyREwrxe");
