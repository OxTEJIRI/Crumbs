"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useCrumbJarProgram } from "@/lib/solana/useCrumbJarProgram";
import {
  settledCrumbs,
  type CookieJarState,
} from "./useCookieJar";
import { useNowSeconds } from "./useNowSeconds";
import { describeError } from "./useTransactionStatus";

export interface LeaderboardEntry extends CookieJarState {
  jar: PublicKey;
  crumbs: number;
}

const REFRESH_INTERVAL_MS = 30_000;

/**
 * Ranks every jar the program owns. Jars are plain program accounts rather
 * than digital assets, so they come from getProgramAccounts; a DAS index would
 * only cover Metaplex assets and would not see them.
 */
export function useLeaderboard(limit = 10) {
  const program = useCrumbJarProgram();
  const nowSeconds = useNowSeconds();

  const [jars, setJars] = useState<(CookieJarState & { jar: PublicKey })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJars = useCallback(async () => {
    const accounts = await program.account.cookieJar.all();
    return accounts.map((entry) => ({
      ...(entry.account as CookieJarState),
      jar: entry.publicKey,
    }));
  }, [program]);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetchJars()
        .then((next) => {
          if (!cancelled) {
            setJars(next);
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
  }, [fetchJars]);

  // Rank on settled wealth rather than the stored balance, otherwise a player
  // who simply claimed recently outranks a richer one who has not.
  const entries = useMemo<LeaderboardEntry[]>(
    () =>
      jars
        .map((jar) => ({ ...jar, crumbs: settledCrumbs(jar, nowSeconds).total }))
        .sort((a, b) => b.crumbs - a.crumbs)
        .slice(0, limit),
    [jars, nowSeconds, limit]
  );

  return { entries, loading, error };
}
