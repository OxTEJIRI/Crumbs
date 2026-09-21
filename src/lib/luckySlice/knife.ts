/**
 * The knife swings up and down over the cookie on a fixed cycle; tapping at
 * the right moment is the whole game. This is pure gameplay math (no React,
 * no chain) so it can be reasoned about and, if it's ever worth it, unit
 * tested independently — same separation as the Cookie Crush board.
 */

export const BPS_DENOMINATOR = 10_000;

/** One full up-and-down sweep. */
export const CYCLE_MS = 4000;

/**
 * Position along the cookie at a given moment, as a 0..1 triangle wave: 0 at
 * the top (start of the cycle), 1 at the bottom (half a cycle in), back to 0
 * at the end. A triangle wave (not a sine) moves at a constant speed, so
 * every point along the cookie is equally likely to be tapped rather than
 * the ends being "sticky" the way a sine's slow turnarounds would make them.
 */
export function knifePositionFraction(elapsedMs: number, cycleMs = CYCLE_MS): number {
  const t = ((elapsedMs % cycleMs) + cycleMs) % cycleMs; // handle any negative input safely
  const half = cycleMs / 2;
  return t < half ? t / half : 2 - t / half;
}

/** Converts a tap's timing into the basis-points cut value the chain expects. */
export function fractionToBps(fraction: number): number {
  return Math.round(Math.max(0, Math.min(1, fraction)) * BPS_DENOMINATOR);
}
