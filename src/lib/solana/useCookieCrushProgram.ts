"use client";

import { useMemo } from "react";
import { AnchorProvider, Program } from "@anchor-lang/core";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { cookieCrushIdl, type CookieCrush } from "./cookieCrush";
import { READ_ONLY_WALLET } from "./readOnlyWallet";

export function useCookieCrushProgram(): Program<CookieCrush> {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMemo(() => {
    const provider = new AnchorProvider(connection, wallet ?? READ_ONLY_WALLET, {
      commitment: "confirmed",
    });
    return new Program<CookieCrush>(cookieCrushIdl, provider);
  }, [connection, wallet]);
}
