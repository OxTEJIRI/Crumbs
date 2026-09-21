"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getStatsPda } from "@/lib/solana/luckySlice";
import { useLuckySliceProgram } from "@/lib/solana/useLuckySliceProgram";
import { describeError, useTransactionStatus } from "./useTransactionStatus";

export interface SliceStatsState {
  bestCutBps: number;
  attempts: number;
}

const ROLL_PATTERN = /Sliced for (\d+)bps/;

/** The program reports the actual roll in its logs; the account only ever holds the running best. */
async function readRoll(
  connection: ReturnType<typeof useConnection>["connection"],
  signature: string
): Promise<number | null> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const detail = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    const line = detail?.meta?.logMessages?.find((log) =>
      log.includes("Sliced for")
    );
    if (line) {
      const match = line.match(ROLL_PATTERN);
      return match ? Number(match[1]) : null;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return null;
}

export function useLuckySlice() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const program = useLuckySliceProgram();
  const { status, run } = useTransactionStatus();

  const stats = useMemo(
    () => (publicKey ? getStatsPda(publicKey) : null),
    [publicKey]
  );

  const [state, setState] = useState<SliceStatsState | null>(null);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (): Promise<SliceStatsState | null> => {
    if (!stats) return null;
    const account = await program.account.sliceStats.fetchNullable(stats);
    if (!account) return null;
    return {
      bestCutBps: account.bestCutBps,
      attempts: account.attempts.toNumber(),
    };
  }, [program, stats]);

  const refresh = useCallback(async () => {
    try {
      setState(await fetchStats());
    } catch (err) {
      setError(describeError(err));
    }
  }, [fetchStats]);

  useEffect(() => {
    let cancelled = false;
    fetchStats()
      .then((next) => {
        if (!cancelled) setState(next);
      })
      .catch((err) => {
        if (!cancelled) setError(describeError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [fetchStats]);

  const slice = useCallback(async () => {
    if (!publicKey) return false;

    return run(
      "Slicing",
      () => program.methods.slice().accountsPartial({ player: publicKey }).transaction(),
      async (signature) => {
        setLastRoll(await readRoll(connection, signature));
        await refresh();
      }
    );
  }, [program, publicKey, run, refresh, connection]);

  return {
    state,
    lastRoll,
    status,
    error,
    slice,
  };
}
