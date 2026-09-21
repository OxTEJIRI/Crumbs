import { PublicKey } from "@solana/web3.js";
import idl from "./idl/lucky_slice.json";
import type { LuckySliceProgram } from "./idl/lucky_slice";

export const LUCKY_SLICE_PROGRAM_ID = new PublicKey(idl.address);

const STATS_SEED = Buffer.from("slice");

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

export { idl as luckySliceIdl };
export type { LuckySliceProgram };
