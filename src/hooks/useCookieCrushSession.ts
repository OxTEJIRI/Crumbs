"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  BOOST_COST_CRUMBS,
  getLevelScorePda,
  getSessionPda,
} from "@/lib/solana/cookieCrush";
import {
  CRUMB_JAR_PROGRAM_ID,
  CRUMB_MINT,
  getJarCrumbsAta,
  getJarPda,
} from "@/lib/solana/program";
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

  const startLevel = useCallback(
    async (boost = false) => {
      if (!publicKey) return false;

      const jar = getJarPda(publicKey);
      // Anchor rejects a mix of set and unset optional accounts, so a free
      // round passes null for every one of them.
      const boostAccounts = boost
        ? {
            jar,
            crumbMint: CRUMB_MINT,
            jarCrumbs: getJarCrumbsAta(jar),
            crumbJarProgram: CRUMB_JAR_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
          }
        : {
            jar: null,
            crumbMint: null,
            jarCrumbs: null,
            crumbJarProgram: null,
            tokenProgram: null,
          };

      return run(
        boost
          ? `Paying ${BOOST_COST_CRUMBS} crumbs for a longer round`
          : "Starting Cookie Crush",
        () =>
          program.methods
            .startLevel(levelId, boost)
            .accountsPartial({
              player: publicKey,
              session: getSessionPda(publicKey, levelId),
              ...boostAccounts,
            })
            .transaction(),
        refresh
      );
    },
    [program, publicKey, levelId, run, refresh]
  );

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
