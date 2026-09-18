import { PublicKey } from "@solana/web3.js";
import idl from "./idl/crumb_jar.json";
import type { CrumbJar } from "./idl/crumb_jar";

export const CRUMB_JAR_PROGRAM_ID = new PublicKey(idl.address);

export const JAR_SEED = Buffer.from("cookie_jar");

export function getJarPda(owner: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [JAR_SEED, owner.toBuffer()],
    CRUMB_JAR_PROGRAM_ID
  );
  return pda;
}

export { idl as crumbJarIdl };
export type { CrumbJar };
