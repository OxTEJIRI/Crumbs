"use client";

import { useMemo } from "react";
import { AnchorProvider, Program } from "@anchor-lang/core";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { crumbJarIdl, type CrumbJar } from "./program";

export function useCrumbJarProgram(): Program<CrumbJar> | null {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMemo(() => {
    if (!wallet) return null;

    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    return new Program<CrumbJar>(crumbJarIdl, provider);
  }, [connection, wallet]);
}
