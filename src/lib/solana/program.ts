import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import idl from "./idl/crumb_jar.json";
import type { CrumbJar } from "./idl/crumb_jar";

export const CRUMB_JAR_PROGRAM_ID = new PublicKey(idl.address);

export const JAR_SEED = Buffer.from("cookie_jar");
export const MINT_AUTHORITY_SEED = Buffer.from("crumb_mint_authority");

/** Read straight from the program's own IDL so the UI can't drift from the mint the chain actually enforces. */
export const CRUMB_MINT = new PublicKey(
  idl.constants.find((c) => c.name === "CRUMB_MINT")!.value as string
);

export function getJarPda(owner: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [JAR_SEED, owner.toBuffer()],
    CRUMB_JAR_PROGRAM_ID
  );
  return pda;
}

/**
 * Where a jar's $CRUMB actually lives. The authority is the jar PDA rather
 * than the player's wallet, which is what lets a raid move crumbs out without
 * the victim signing for it -- exactly what raids did back when the balance
 * was a plain number on the jar account.
 */
export function getJarCrumbsAta(jar: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(CRUMB_MINT, jar, true);
}

export { idl as crumbJarIdl };
export type { CrumbJar };
