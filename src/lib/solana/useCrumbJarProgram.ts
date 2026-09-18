"use client";

import { useMemo } from "react";
import { AnchorProvider, Program, type Wallet } from "@anchor-lang/core";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { crumbJarIdl, type CrumbJar } from "./program";

/**
 * Stands in when nobody has connected yet so public reads — the leaderboard
 * above all — still work. Every signing path guards on a real connected key
 * before it builds a transaction, so these are never reached.
 */
const READ_ONLY_WALLET = {
  publicKey: PublicKey.default,
  signTransaction: () => Promise.reject(new Error("Wallet not connected")),
  signAllTransactions: () => Promise.reject(new Error("Wallet not connected")),
} as unknown as Wallet;

export function useCrumbJarProgram(): Program<CrumbJar> {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMemo(() => {
    const provider = new AnchorProvider(connection, wallet ?? READ_ONLY_WALLET, {
      commitment: "confirmed",
    });
    return new Program<CrumbJar>(crumbJarIdl, provider);
  }, [connection, wallet]);
}
