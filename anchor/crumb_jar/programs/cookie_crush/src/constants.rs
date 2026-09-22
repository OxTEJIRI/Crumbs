use anchor_lang::prelude::*;

#[constant]
pub const SESSION_SEED: &[u8] = b"session";

#[constant]
pub const SCORE_SEED: &[u8] = b"score";

/// A session must run at least this long before its score can be submitted,
/// so a session can't be opened and closed in the same instant.
#[constant]
pub const MIN_ELAPSED_SECONDS: i64 = 3;

/// Loose plausibility ceiling, not real anti-cheat: gameplay lives entirely in
/// the browser, so nothing here can prove a submitted score came from actual
/// play. This only rejects a score no session of that length could reach.
#[constant]
pub const MAX_SCORE_PER_SECOND: u64 = 80;

/// Flat allowance on top of the per-second ceiling, so a strong opening
/// cascade in the first second or two isn't rejected as "too fast."
#[constant]
pub const SCORE_BURST_ALLOWANCE: u64 = 200;

/// What a longer round costs in $CRUMB. Roughly twelve seconds of a jar's
/// accrual, so it's a real decision without being out of reach.
#[constant]
pub const BOOST_COST_CRUMBS: u64 = 250;

/// How much longer a boosted round runs, on top of the base 60. The clock
/// itself is client-side like the rest of the board, so this is the agreed
/// number both sides work from, not something the chain enforces. The
/// *payment* is enforced; the extra time is as trusted as the score is.
#[constant]
pub const BOOST_EXTRA_SECONDS: i64 = 30;
