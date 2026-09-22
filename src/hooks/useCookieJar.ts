"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey, type Connection } from "@solana/web3.js";
import type { BN } from "@anchor-lang/core";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
} from "@solana/spl-token";
import { getJarCrumbsAta, getJarPda } from "@/lib/solana/program";
import { useCrumbJarProgram } from "@/lib/solana/useCrumbJarProgram";
import { describeError, useTransactionStatus } from "./useTransactionStatus";
import { useNowSeconds } from "./useNowSeconds";

export interface CookieJarState {
  owner: PublicKey;
  /** Frozen once the jar migrates. Only still meaningful while `migrated` is false. */
  crumbBalance: BN;
  productionRate: BN;
  lastClaimedTs: BN;
  lastRaidTs: BN;
  defenseLevel: number;
  bump: number;
  migrated: boolean;
}

/**
 * A jar's real $CRUMB holdings. Returns 0 rather than throwing for a jar that
 * has never claimed, since its token account only gets created on first mint.
 */
export async function fetchCrumbBalance(
  connection: Connection,
  jar: PublicKey
): Promise<number> {
  try {
    const account = await getAccount(connection, getJarCrumbsAta(jar));
    return Number(account.amount);
  } catch (err) {
    if (
      err instanceof TokenAccountNotFoundError ||
      err instanceof TokenInvalidAccountOwnerError
    ) {
      return 0;
    }
    throw err;
  }
}

export function useCookieJar() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useCrumbJarProgram();
  const { status, run } = useTransactionStatus();

  const [jar, setJar] = useState<CookieJarState | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchJar = useCallback(async () => {
    if (!publicKey) return { jar: null, balance: 0 };

    const jarPda = getJarPda(publicKey);
    const [account, tokens] = await Promise.all([
      program.account.cookieJar.fetchNullable(jarPda),
      fetchCrumbBalance(connection, jarPda),
    ]);

    return { jar: account as CookieJarState | null, balance: tokens };
  }, [program, publicKey, connection]);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchJar();
      setJar(next.jar);
      setBalance(next.balance);
    } catch (err) {
      setFetchError(describeError(err));
    }
  }, [fetchJar]);

  useEffect(() => {
    let cancelled = false;

    fetchJar()
      .then((next) => {
        if (!cancelled) {
          setJar(next.jar);
          setBalance(next.balance);
        }
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

  const migrateJar = useCallback(async () => {
    if (!publicKey) return;

    await run(
      "Converting your crumbs to $CRUMB",
      () =>
        program.methods
          .migrateToToken()
          .accounts({ owner: publicKey })
          .transaction(),
      refresh
    );
  }, [program, publicKey, run, refresh]);

  return {
    jar,
    balance,
    loading,
    status,
    error: fetchError,
    mintJar,
    claimCrumbs,
    migrateJar,
    refresh,
  };
}

/** The fields any jar-shaped record needs for its accrual to be estimated. */
export type AccruingJar = Pick<
  CookieJarState,
  "crumbBalance" | "productionRate" | "lastClaimedTs" | "migrated"
>;

/**
 * Crumbs accrue continuously on-chain but are only minted at claim time, so
 * between claims the UI estimates the pending amount from the wall clock.
 *
 * `banked` is the jar's real $CRUMB token balance. A jar that hasn't migrated
 * yet has no tokens at all, so it falls back to the legacy field it's still
 * carrying until its one-time conversion.
 */
export function settledCrumbs(
  jar: AccruingJar,
  nowSeconds: number,
  tokenBalance: number
) {
  const elapsed = Math.max(0, nowSeconds - jar.lastClaimedTs.toNumber());
  const banked = jar.migrated ? tokenBalance : jar.crumbBalance.toNumber();
  const pending = elapsed * jar.productionRate.toNumber();

  return { banked, pending, total: banked + pending };
}

export function useLiveCrumbs(jar: CookieJarState | null, tokenBalance: number) {
  const nowSeconds = useNowSeconds();

  if (!jar) return { banked: 0, pending: 0, total: 0 };
  return settledCrumbs(jar, nowSeconds, tokenBalance);
}
