"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { getJarPda } from "@/lib/solana/program";
import { PRACTICE_JAR_OWNER } from "@/lib/solana/raid";
import { useCrumbJarProgram } from "@/lib/solana/useCrumbJarProgram";
import {
  fetchCrumbBalance,
  settledCrumbs,
  type CookieJarState,
} from "./useCookieJar";
import { useNowSeconds } from "./useNowSeconds";

const REFRESH_INTERVAL_MS = 15_000;

/** Live total for the permanent practice target, so its card can show a real, ticking number. */
export function usePracticeJar() {
  const program = useCrumbJarProgram();
  const { connection } = useConnection();
  const nowSeconds = useNowSeconds();
  const [jar, setJar] = useState<CookieJarState | null>(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const jarPda = getJarPda(PRACTICE_JAR_OWNER);

    const load = () => {
      Promise.all([
        program.account.cookieJar.fetchNullable(jarPda),
        fetchCrumbBalance(connection, jarPda),
      ])
        .then(([account, tokens]) => {
          if (!cancelled) {
            setJar(account as CookieJarState | null);
            setBalance(tokens);
          }
        })
        .catch(() => {
          // A dropped refresh just leaves the last-known total showing.
        });
    };

    load();
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [program, connection]);

  if (!jar) return { total: null };
  return { total: settledCrumbs(jar, nowSeconds, balance).total };
}
