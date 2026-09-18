"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import type { BN } from "@anchor-lang/core";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getJarPda } from "@/lib/solana/program";
import { useCrumbJarProgram } from "@/lib/solana/useCrumbJarProgram";

export interface CookieJarState {
  owner: PublicKey;
  crumbBalance: BN;
  productionRate: BN;
  lastClaimedTs: BN;
  defenseLevel: number;
  bump: number;
}

export type TxStatus = "idle" | "pending" | "confirming" | "confirmed" | "failed";

function describeError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (/user rejected|rejected the request|User denied/i.test(message)) {
    return "You rejected the signature request.";
  }
  if (/insufficient (lamports|funds)/i.test(message)) {
    return "Not enough SOL to pay for this transaction.";
  }
  if (/already in use/i.test(message)) {
    return "You already own a Cookie Jar.";
  }
  if (/blockhash not found|block height exceeded/i.test(message)) {
    return "Transaction expired before confirming. Please try again.";
  }
  return message;
}

export function useCookieJar() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const program = useCrumbJarProgram();

  const [jar, setJar] = useState<CookieJarState | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<TxStatus>("idle");
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchJar = useCallback(async (): Promise<CookieJarState | null> => {
    if (!program || !publicKey) return null;

    return (await program.account.cookieJar.fetchNullable(
      getJarPda(publicKey)
    )) as CookieJarState | null;
  }, [program, publicKey]);

  const refresh = useCallback(async () => {
    try {
      setJar(await fetchJar());
    } catch (err) {
      setError(describeError(err));
    }
  }, [fetchJar]);

  useEffect(() => {
    let cancelled = false;

    fetchJar()
      .then((account) => {
        if (!cancelled) setJar(account);
      })
      .catch((err) => {
        if (!cancelled) setError(describeError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchJar]);

  const sendAndTrack = useCallback(
    async (buildTransaction: () => Promise<Transaction>) => {
      setError(null);
      setSignature(null);
      setStatus("pending");

      try {
        const transaction = await buildTransaction();

        const sig = await sendTransaction(transaction, connection);
        setSignature(sig);
        setStatus("confirming");

        const latestBlockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          { signature: sig, ...latestBlockhash },
          "confirmed"
        );

        setStatus("confirmed");
        await refresh();
      } catch (err) {
        setError(describeError(err));
        setStatus("failed");
      }
    },
    [sendTransaction, connection, refresh]
  );

  const mintJar = useCallback(async () => {
    if (!program || !publicKey) return;

    await sendAndTrack(() =>
      program.methods.initializeJar().accounts({ owner: publicKey }).transaction()
    );
  }, [program, publicKey, sendAndTrack]);

  const claimCrumbs = useCallback(async () => {
    if (!program || !publicKey) return;

    await sendAndTrack(() =>
      program.methods.claimCrumbs().accounts({ owner: publicKey }).transaction()
    );
  }, [program, publicKey, sendAndTrack]);

  return {
    jar,
    loading,
    status,
    signature,
    error,
    mintJar,
    claimCrumbs,
    refresh,
  };
}

/**
 * Crumbs accrue continuously on-chain but are only written at claim time, so
 * between claims the UI ticks an estimate from the wall clock.
 */
export function useLiveCrumbs(jar: CookieJarState | null) {
  const [nowSeconds, setNowSeconds] = useState(() =>
    Math.floor(Date.now() / 1000)
  );

  useEffect(() => {
    if (!jar) return;

    const id = setInterval(
      () => setNowSeconds(Math.floor(Date.now() / 1000)),
      1000
    );
    return () => clearInterval(id);
  }, [jar]);

  if (!jar) return { banked: 0, pending: 0, total: 0 };

  const elapsed = Math.max(0, nowSeconds - jar.lastClaimedTs.toNumber());
  const banked = jar.crumbBalance.toNumber();
  const pending = elapsed * jar.productionRate.toNumber();

  return { banked, pending, total: banked + pending };
}
