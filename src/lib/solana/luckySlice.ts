import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import idl from "./idl/lucky_slice.json";
import type { LuckySliceProgram } from "./idl/lucky_slice";
import { CRUMB_MINT } from "./program";

export const LUCKY_SLICE_PROGRAM_ID = new PublicKey(idl.address);

const STATS_SEED = Buffer.from("slice");
const ROUND_SEED = Buffer.from("round");

export const BPS_DENOMINATOR = Number(
  idl.constants.find((c) => c.name === "BPS_DENOMINATOR")!.value
);

export function getStatsPda(player: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [STATS_SEED, player.toBuffer()],
    LUCKY_SLICE_PROGRAM_ID
  );
  return pda;
}

export function getRoundPda(player: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [ROUND_SEED, player.toBuffer()],
    LUCKY_SLICE_PROGRAM_ID
  );
  return pda;
}

export const WAGER_STAKE_CRUMBS = Number(
  idl.constants.find((c) => c.name === "WAGER_STAKE_CRUMBS")!.value
);

export const WAGER_ACCURACY_BPS = Number(
  idl.constants.find((c) => c.name === "WAGER_ACCURACY_BPS")!.value
);

/**
 * Where a staked round's crumbs sit until it settles. The authority is the
 * round itself, so only this program can release them, and only once the cut
 * is in.
 */
export function getWagerEscrowAta(round: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(CRUMB_MINT, round, true);
}

export { idl as luckySliceIdl };
export type { LuckySliceProgram };
