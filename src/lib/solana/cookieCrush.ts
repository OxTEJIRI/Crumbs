import { PublicKey } from "@solana/web3.js";
import idl from "./idl/cookie_crush.json";
import type { CookieCrush } from "./idl/cookie_crush";

export const COOKIE_CRUSH_PROGRAM_ID = new PublicKey(idl.address);

const SESSION_SEED = Buffer.from("session");
const SCORE_SEED = Buffer.from("score");

export function getSessionPda(
  player: PublicKey,
  levelId: number
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [SESSION_SEED, player.toBuffer(), Buffer.from([levelId])],
    COOKIE_CRUSH_PROGRAM_ID
  );
  return pda;
}

export function getLevelScorePda(
  player: PublicKey,
  levelId: number
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [SCORE_SEED, player.toBuffer(), Buffer.from([levelId])],
    COOKIE_CRUSH_PROGRAM_ID
  );
  return pda;
}

/** Read from the program's own IDL, so the UI can't drift from what the chain charges. */
function constant(name: string): number {
  const entry = idl.constants.find((c) => c.name === name);
  if (!entry) throw new Error(`Cookie Crush IDL has no constant named ${name}`);
  return Number(entry.value);
}

export const BOOST_COST_CRUMBS = constant("BOOST_COST_CRUMBS");
export const BOOST_EXTRA_SECONDS = constant("BOOST_EXTRA_SECONDS");

export { idl as cookieCrushIdl };
export type { CookieCrush };
