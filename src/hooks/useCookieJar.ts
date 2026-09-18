"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import type { BN } from "@anchor-lang/core";
import { useWallet } from "@solana/wallet-adapter-react";
import { getJarPda } from "@/lib/solana/program";
import { useCrumbJarProgram } from "@/lib/solana/useCrumbJarProgram";
import { describeError, useTransactionStatus } from "./useTransactionStatus";
import { useNowSeconds } from "./useNowSeconds";

export interface CookieJarState {
  owner: PublicKey;
  crumbBalance: BN;
  productionRate: BN;
  lastClaimedTs: BN;
  lastRaidTs: BN;
  defenseLevel: number;
  bump: number;
}

export function useCookieJar() {
  const { publicKey } = useWallet();
  const program = useCrumbJarProgram();
  const { status, run } = useTransactionStatus();

  const [jar, setJar] = useState<CookieJarState | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchJar = useCallback(async (): Promise<CookieJarState | null> => {
    if (!publicKey) return null;

    return (await program.account.cookieJar.fetchNullable(
      getJarPda(publicKey)
    )) as CookieJarState | null;
  }, [program, publicKey]);

  const refresh = useCallback(async () => {
    try {
      setJar(await fetchJar());
    } catch (err) {
      setFetchError(describeError(err));
    }
  }, [fetchJar]);

  useEffect(() => {
    let cancelled = false;

    fetchJar()
      .then((account) => {
        if (!cancelled) setJar(account);
      })
      .catch((err) => {
        if (!cancelled) setFetchError(describeError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchJar]);

  const mintJar = useCallback(async () => {
    if (!publicKey) return;

    await run(
      "Minting your Cookie Jar",
      () =>
        program.methods
          .initializeJar()
          .accounts({ owner: publicKey })
          .transaction(),
      refresh
    );
  }, [program, publicKey, run, refresh]);

  const claimCrumbs = useCallback(async () => {
    if (!publicKey) return;

    await run(
      "Claiming crumbs",
      () =>
        program.methods.claimCrumbs().accounts({ owner: publicKey }).transaction(),
      refresh
    );
  }, [program, publicKey, run, refresh]);

  return {
    jar,
    loading,
    status,
    error: fetchError,
    mintJar,
    claimCrumbs,
    refresh,
  };
}

/** The fields any jar-shaped record needs for its accrual to be estimated. */
export type AccruingJar = Pick<
  CookieJarState,
  "crumbBalance" | "productionRate" | "lastClaimedTs"
>;

/**
 * Crumbs accrue continuously on-chain but are only written at claim time, so
 * between claims the UI estimates the balance from the wall clock.
 */
export function settledCrumbs(jar: AccruingJar, nowSeconds: number) {
  const elapsed = Math.max(0, nowSeconds - jar.lastClaimedTs.toNumber());
  const banked = jar.crumbBalance.toNumber();
  const pending = elapsed * jar.productionRate.toNumber();

  return { banked, pending, total: banked + pending };
}

export function useLiveCrumbs(jar: CookieJarState | null) {
  const nowSeconds = useNowSeconds();

  if (!jar) return { banked: 0, pending: 0, total: 0 };
  return settledCrumbs(jar, nowSeconds);
}
