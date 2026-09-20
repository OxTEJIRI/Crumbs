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

export { idl as cookieCrushIdl };
export type { CookieCrush };
