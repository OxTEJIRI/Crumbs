import { PublicKey } from "@solana/web3.js";
import idl from "./idl/nibble.json";
import type { NibbleProgram } from "./idl/nibble";

export const NIBBLE_PROGRAM_ID = new PublicKey(idl.address);

export const OVEN_SEED = Buffer.from("oven");

/** Reads a numeric constant straight from the program's own IDL, so the UI can never drift from what the chain actually enforces. */
function constant(name: string): number {
  const entry = idl.constants.find((c) => c.name === name);
  if (!entry) throw new Error(`Nibble IDL has no constant named ${name}`);
  return Number(entry.value);
}

export const MAX_HP = constant("MAX_HP");
export const MAX_HEAT = constant("MAX_HEAT");
export const BPS_DENOMINATOR = constant("BPS_DENOMINATOR");
export const MIN_BAKE_LAMPORTS = constant("MIN_BAKE_LAMPORTS");
export const MIN_NIBBLE_LAMPORTS = constant("MIN_NIBBLE_LAMPORTS");
export const BAKER_LOCK_SLOTS = constant("BAKER_LOCK_SLOTS");
export const IDLE_SLOTS = constant("IDLE_SLOTS");
export const IDLE_HEAT = constant("IDLE_HEAT");
export const DAMAGE_MIN_BPS = constant("DAMAGE_MIN_BPS");
export const DAMAGE_MAX_BPS = constant("DAMAGE_MAX_BPS");
export const DAMAGE_K = constant("DAMAGE_K");
export const PAYOUT_SHARE_BPS = constant("PAYOUT_SHARE_BPS");
export const HEAT_BASE = constant("HEAT_BASE");
export const HEAT_SCALE = constant("HEAT_SCALE");
export const JAR_SHARE_BPS = constant("JAR_SHARE_BPS");
export const GLAZE_HEAT_REDUCTION = constant("GLAZE_HEAT_REDUCTION");
export const GLAZE_HP_RESTORE = constant("GLAZE_HP_RESTORE");
export const GLAZE_BASE_COST_LAMPORTS = constant("GLAZE_BASE_COST_LAMPORTS");
export const GLAZE_HEAT_DIVISOR = constant("GLAZE_HEAT_DIVISOR");

export const JAR_ADDRESS = new PublicKey(
  idl.constants.find((c) => c.name === "JAR_ADDRESS")!.value as string
);

/** The whole game is one account — a singleton PDA the oven recycles per batch. */
export function getOvenPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync([OVEN_SEED], NIBBLE_PROGRAM_ID);
  return pda;
}

// The four functions below mirror the program's `math.rs` exactly so the UI
// can show what a bite would do before the player signs for it. They are
// previews only — the chain recomputes everything from its own state.

export function damageBps(bidLamports: number, hp: number): number {
  if (hp === 0 || bidLamports === 0) return 0;

  const range = DAMAGE_MAX_BPS - DAMAGE_MIN_BPS;
  const denominator = bidLamports + DAMAGE_K * hp;
  const damage = DAMAGE_MIN_BPS + Math.floor((range * bidLamports) / denominator);
  return Math.min(damage, hp);
}

export function payoutLamports(
  potAfterBid: number,
  damage: number,
  hpBefore: number
): number {
  if (hpBefore === 0 || damage === 0) return 0;

  const crumbs = Math.floor(
    (potAfterBid * damage * PAYOUT_SHARE_BPS) / (hpBefore * BPS_DENOMINATOR)
  );
  return Math.min(crumbs, potAfterBid);
}

export function heatDelta(damage: number): number {
  return HEAT_BASE + Math.floor((HEAT_SCALE * damage) / MAX_HP);
}

export function glazeCostLamports(heat: number): number {
  return GLAZE_BASE_COST_LAMPORTS + Math.floor((heat * heat) / GLAZE_HEAT_DIVISOR);
}

export { idl as nibbleIdl };
export type { NibbleProgram };
