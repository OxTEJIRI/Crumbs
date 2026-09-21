"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useLuckySliceProgram } from "@/lib/solana/useLuckySliceProgram";
import { describeError } from "./useTransactionStatus";

export interface LuckySliceLeaderboardEntry {
  player: PublicKey;
  bestCutBps: number;
  attempts: number;
}

const REFRESH_INTERVAL_MS = 30_000;

/** Ranks every player's SliceStats account, read via getProgramAccounts. */
export function useLuckySliceLeaderboard(limit = 10) {
  const program = useLuckySliceProgram();

  const [entries, setEntries] = useState<LuckySliceLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    const accounts = await program.account.sliceStats.all();
    return accounts.map((entry) => ({
      player: entry.account.player,
      bestCutBps: entry.account.bestCutBps,
      attempts: entry.account.attempts.toNumber(),
    }));
  }, [program]);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetchEntries()
        .then((next) => {
          if (!cancelled) {
            setEntries(next);
            setError(null);
          }
        })
        .catch((err) => {
          if (!cancelled) setError(describeError(err));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    load();
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [fetchEntries]);

  const ranked = useMemo(
    () => [...entries].sort((a, b) => b.bestCutBps - a.bestCutBps).slice(0, limit),
    [entries, limit]
  );

  return { entries: ranked, loading, error };
}
