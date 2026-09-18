import { PublicKey } from "@solana/web3.js";
import { CRUMB_JAR_PROGRAM_ID } from "./program";

export const RAID_SEED = Buffer.from("raid");

export function getRaidPda(attacker: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [RAID_SEED, attacker.toBuffer()],
    CRUMB_JAR_PROGRAM_ID
  );
  return pda;
}

export function generateSecret(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Must match the program: sha256(secret || attacker). Binding the attacker in
 * stops anyone else from reusing a secret they saw in the mempool.
 */
export async function commitmentFor(
  secret: Uint8Array,
  attacker: PublicKey
): Promise<number[]> {
  const payload = new Uint8Array(64);
  payload.set(secret, 0);
  payload.set(attacker.toBytes(), 32);

  const digest = await crypto.subtle.digest("SHA-256", payload);
  return Array.from(new Uint8Array(digest));
}

/**
 * Commit and reveal are separate transactions, so the secret has to outlive a
 * page reload or the staked crumbs are stranded until the raid is abandoned.
 */
const storageKey = (attacker: PublicKey) => `crumbs:raid-secret:${attacker}`;

export function rememberSecret(attacker: PublicKey, secret: Uint8Array) {
  try {
    localStorage.setItem(storageKey(attacker), JSON.stringify(Array.from(secret)));
  } catch {
    // Private browsing and blocked site data both throw; the raid is still
    // revealable this session from in-memory state.
  }
}

export function recallSecret(attacker: PublicKey): Uint8Array | null {
  try {
    const raw = localStorage.getItem(storageKey(attacker));
    if (!raw) return null;

    const bytes = JSON.parse(raw) as number[];
    return bytes.length === 32 ? Uint8Array.from(bytes) : null;
  } catch {
    return null;
  }
}

export function forgetSecret(attacker: PublicKey) {
  try {
    localStorage.removeItem(storageKey(attacker));
  } catch {
    // Nothing to do; a stale secret is harmless once its raid is closed.
  }
}
