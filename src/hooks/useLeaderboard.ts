"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { AccountLayout } from "@solana/spl-token";
import { getJarCrumbsAta } from "@/lib/solana/program";
import { useCrumbJarProgram } from "@/lib/solana/useCrumbJarProgram";
import { settledCrumbs, type CookieJarState } from "./useCookieJar";
import { useNowSeconds } from "./useNowSeconds";
import { describeError } from "./useTransactionStatus";

export interface LeaderboardEntry extends CookieJarState {
  jar: PublicKey;
  crumbs: number;
}

const REFRESH_INTERVAL_MS = 30_000;

/** getMultipleAccounts caps out at 100 per request. */
const MAX_ACCOUNTS_PER_FETCH = 100;

type RankedJar = CookieJarState & { jar: PublicKey; tokens: number };

/**
 * Ranks every jar the program owns. Jars are plain program accounts rather
 * than digital assets, so they come from getProgramAccounts; a DAS index would
 * only cover Metaplex assets and would not see them.
 */
export function useLeaderboard(limit = 10) {
  const program = useCrumbJarProgram();
  const { connection } = useConnection();
  const nowSeconds = useNowSeconds();

  const [jars, setJars] = useState<RankedJar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJars = useCallback(async (): Promise<RankedJar[]> => {
    const accounts = await program.account.cookieJar.all();

    // Each jar's token account is at a known address, so these can be read
    // directly. Scanning the whole token program for holders of the mint
    // would work too, but it is a far heavier ask of the RPC for the same
    // answer.
    const atas = accounts.map((entry) => getJarCrumbsAta(entry.publicKey));
    const infos: (Awaited<
      ReturnType<typeof connection.getMultipleAccountsInfo>
    >[number])[] = [];
    for (let i = 0; i < atas.length; i += MAX_ACCOUNTS_PER_FETCH) {
      infos.push(
        ...(await connection.getMultipleAccountsInfo(
          atas.slice(i, i + MAX_ACCOUNTS_PER_FETCH)
        ))
      );
    }

    return accounts.map((entry, index) => {
      const info = infos[index];
      return {
        ...(entry.account as CookieJarState),
        jar: entry.publicKey,
        // Null for a jar that has never claimed, since its token account
        // isn't created until the first mint.
        tokens: info ? Number(AccountLayout.decode(info.data).amount) : 0,
      };
    });
  }, [program, connection]);

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

  // Rank on settled wealth rather than the claimed balance, otherwise a player
  // who simply claimed recently outranks a richer one who has not.
  const entries = useMemo<LeaderboardEntry[]>(
    () =>
      jars
        .map((jar) => ({
          ...jar,
          crumbs: settledCrumbs(jar, nowSeconds, jar.tokens).total,
        }))
        .sort((a, b) => b.crumbs - a.crumbs)
        .slice(0, limit),
    [jars, nowSeconds, limit]
  );

  return { entries, loading, error };
}
