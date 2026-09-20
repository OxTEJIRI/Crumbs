"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  getLevelScorePda,
  getSessionPda,
} from "@/lib/solana/cookieCrush";
import { useCookieCrushProgram } from "@/lib/solana/useCookieCrushProgram";
import { describeError, useTransactionStatus } from "./useTransactionStatus";

export interface LevelScoreState {
  bestScore: number;
  attempts: number;
}

export function useCookieCrushSession(levelId: number) {
  const { publicKey } = useWallet();
  const program = useCookieCrushProgram();
  const { status, run } = useTransactionStatus();

  const [inSession, setInSession] = useState(false);
  const [bestScore, setBestScore] = useState<LevelScoreState | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    if (!publicKey) return null;

    const [session, score] = await Promise.all([
      program.account.session.fetchNullable(
        getSessionPda(publicKey, levelId)
      ),
      program.account.levelScore.fetchNullable(
        getLevelScorePda(publicKey, levelId)
      ),
    ]);
    return {
      inSession: session !== null,
      bestScore: score
        ? { bestScore: score.bestScore, attempts: score.attempts }
        : null,
    };
  }, [program, publicKey, levelId]);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchState();
      if (next) {
        setInSession(next.inSession);
        setBestScore(next.bestScore);
      }
    } catch (err) {
      setFetchError(describeError(err));
    }
  }, [fetchState]);

  useEffect(() => {
    let cancelled = false;

    fetchState()
      .then((next) => {
        if (cancelled || !next) return;
        setInSession(next.inSession);
        setBestScore(next.bestScore);
      })
      .catch((err) => {
        if (!cancelled) setFetchError(describeError(err));
      });

    return () => {
      cancelled = true;
    };
  }, [fetchState]);

  const startLevel = useCallback(async () => {
    if (!publicKey) return false;

    return run(
      "Starting Cookie Crush",
      () =>
        program.methods
          .startLevel(levelId)
          .accountsPartial({
            player: publicKey,
            session: getSessionPda(publicKey, levelId),
          })
          .transaction(),
      refresh
    );
  }, [program, publicKey, levelId, run, refresh]);

  const submitScore = useCallback(
    async (score: number) => {
      if (!publicKey) return false;

      return run(
        "Submitting your score",
        () =>
          program.methods
            .submitScore(levelId, score)
            .accountsPartial({
              player: publicKey,
              session: getSessionPda(publicKey, levelId),
              levelScore: getLevelScorePda(publicKey, levelId),
            })
            .transaction(),
        refresh
      );
    },
    [program, publicKey, levelId, run, refresh]
  );

  return {
    inSession,
    bestScore,
    status,
    error: fetchError,
    startLevel,
    submitScore,
  };
}
