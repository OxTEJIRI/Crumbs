//! Pure integer arithmetic for Nibble's economy. Kept separate from the
//! instruction handlers so it can be unit-tested directly — real lamports
//! move on these numbers, so they're checked here rather than only
//! exercised indirectly through a full instruction test.

use crate::constants::*;

/// damage = D_MIN + (D_MAX - D_MIN) * bid / (bid + K * hp), clamped so a
/// bite can never take HP below zero. u128 intermediates: a bid can be up to
/// ~u64::MAX lamports, and multiplying that by a bps range would overflow
/// u64.
pub fn damage_bps(bid_lamports: u64, hp: u32) -> u32 {
    if hp == 0 || bid_lamports == 0 {
        return 0;
    }

    let bid = bid_lamports as u128;
    let k_hp = (DAMAGE_K as u128) * (hp as u128);
    let denom = bid + k_hp; // always > 0: bid > 0 here

    let range = (DAMAGE_MAX_BPS - DAMAGE_MIN_BPS) as u128;
    let scaled = (range * bid) / denom;
    let damage = (DAMAGE_MIN_BPS as u128) + scaled;

    (damage as u32).min(hp)
}

/// crumbs = pot_after_bid * damage / hp_before_bite * PAYOUT_SHARE_BPS / 10_000,
/// drawn from the pot after this bite's bid has already joined it. Bounded
/// by construction (damage <= hp_before, PAYOUT_SHARE_BPS < BPS_DENOMINATOR)
/// but clamped to pot anyway — real money, worth the extra safety.
pub fn payout_lamports(pot_after_bid: u64, damage: u32, hp_before: u32) -> u64 {
    if hp_before == 0 || damage == 0 {
        return 0;
    }

    let pot = pot_after_bid as u128;
    let numerator = pot * (damage as u128) * (PAYOUT_SHARE_BPS as u128);
    let denominator = (hp_before as u128) * (BPS_DENOMINATOR as u128);
    let crumbs = numerator / denominator;

    (crumbs as u64).min(pot_after_bid)
}

/// heat_delta = HEAT_BASE + HEAT_SCALE * damage / MAX_HP — a flat cost per
/// bite plus a share proportional to how hard it hit.
pub fn heat_delta(damage: u32) -> u32 {
    let scaled = (HEAT_SCALE as u64 * damage as u64) / (MAX_HP as u64);
    HEAT_BASE + (scaled as u32)
}

/// cost = GLAZE_BASE_COST + heat^2 / GLAZE_HEAT_DIVISOR — cheap early,
/// a panic spend late.
pub fn glaze_cost_lamports(heat: u32) -> u64 {
    let heat_sq = (heat as u128) * (heat as u128);
    let extra = heat_sq / (GLAZE_HEAT_DIVISOR as u128);
    GLAZE_BASE_COST_LAMPORTS + (extra as u64)
}

/// jar_cut + remainder always sum to exactly `pot` (integer division rounds
/// the cut down, so the remainder gets any leftover dust rather than the
/// jar) — used identically for the eaten payout, a pull, and a burn.
pub fn split_jar_share(pot: u64, jar_bps: u32) -> (u64, u64) {
    let jar_cut = ((pot as u128) * (jar_bps as u128) / (BPS_DENOMINATOR as u128)) as u64;
    (jar_cut, pot - jar_cut)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn damage_is_zero_for_zero_bid_or_zero_hp() {
        assert_eq!(damage_bps(0, MAX_HP), 0);
        assert_eq!(damage_bps(MIN_NIBBLE_LAMPORTS, 0), 0);
    }

    #[test]
    fn damage_stays_within_configured_bounds() {
        // A tiny bid against full HP should land near D_MIN.
        let small = damage_bps(MIN_NIBBLE_LAMPORTS, MAX_HP);
        assert!(small >= DAMAGE_MIN_BPS && small < DAMAGE_MIN_BPS + 100);

        // An enormous bid should approach, but never reach or exceed, D_MAX.
        let huge = damage_bps(u64::MAX / 2, MAX_HP);
        assert!(huge < DAMAGE_MAX_BPS);
        assert!(huge > DAMAGE_MAX_BPS - 10);
    }

    #[test]
    fn damage_never_exceeds_remaining_hp() {
        let low_hp = 50;
        let damage = damage_bps(u64::MAX / 2, low_hp);
        assert!(damage <= low_hp);
    }

    #[test]
    fn damage_increases_monotonically_with_bid() {
        let mut previous = 0u32;
        for bid in [
            MIN_NIBBLE_LAMPORTS,
            10_000_000,
            50_000_000,
            200_000_000,
            1_000_000_000,
        ] {
            let damage = damage_bps(bid, MAX_HP);
            assert!(
                damage >= previous,
                "damage should not decrease as bid grows: {bid} -> {damage}, previous {previous}"
            );
            previous = damage;
        }
    }

    #[test]
    fn payout_never_exceeds_the_pot() {
        let pot = 100_000_000u64;
        let payout = payout_lamports(pot, DAMAGE_MAX_BPS, DAMAGE_MAX_BPS);
        assert!(payout <= pot);
        // PAYOUT_SHARE_BPS < BPS_DENOMINATOR, so a full-HP-in-one-bite
        // payout should still leave something behind for the pot.
        assert!(payout < pot);
    }

    #[test]
    fn payout_is_zero_when_theres_no_damage_or_no_prior_hp() {
        assert_eq!(payout_lamports(1_000_000, 0, MAX_HP), 0);
        assert_eq!(payout_lamports(1_000_000, 100, 0), 0);
    }

    #[test]
    fn glaze_cost_rises_with_heat_and_low_heat_stays_cheap() {
        let cheap = glaze_cost_lamports(0);
        let mid = glaze_cost_lamports(MAX_HEAT / 2);
        let panic = glaze_cost_lamports(MAX_HEAT);

        assert_eq!(cheap, GLAZE_BASE_COST_LAMPORTS);
        assert!(mid > cheap);
        assert!(panic > mid);
    }

    #[test]
    fn jar_split_always_sums_to_the_original_pot() {
        for pot in [0u64, 1, 100, 999, 50_000_000, u64::MAX / 1_000] {
            let (jar_cut, remainder) = split_jar_share(pot, JAR_SHARE_BPS);
            assert_eq!(jar_cut + remainder, pot);
        }
    }

    #[test]
    fn full_burn_split_sends_everything_to_the_jar() {
        let (jar_cut, remainder) = split_jar_share(12_345_678, BPS_DENOMINATOR);
        assert_eq!(jar_cut, 12_345_678);
        assert_eq!(remainder, 0);
    }
}
