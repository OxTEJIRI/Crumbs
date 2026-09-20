"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useCookieCrushProgram } from "@/lib/solana/useCookieCrushProgram";
import { describeError } from "./useTransactionStatus";

export interface CookieCrushLeaderboardEntry {
  player: PublicKey;
  bestScore: number;
  attempts: number;
}

const REFRESH_INTERVAL_MS = 30_000;

/** Ranks every LevelScore account for one level, read via getProgramAccounts. */
export function useCookieCrushLeaderboard(levelId: number, limit = 10) {
  const program = useCookieCrushProgram();

  const [scores, setScores] = useState<CookieCrushLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = useCallback(async () => {
    const accounts = await program.account.levelScore.all();
    return accounts
      .filter((entry) => entry.account.levelId === levelId)
      .map((entry) => ({
        player: entry.account.player,
        bestScore: entry.account.bestScore,
        attempts: entry.account.attempts,
      }));
  }, [program, levelId]);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetchScores()
        .then((next) => {
          if (!cancelled) {
            setScores(next);
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
  }, [fetchScores]);

  const entries = useMemo(
    () => [...scores].sort((a, b) => b.bestScore - a.bestScore).slice(0, limit),
    [scores, limit]
  );

  return { entries, loading, error };
}
