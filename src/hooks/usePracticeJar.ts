"use client";

import { useEffect, useState } from "react";
import { getJarPda } from "@/lib/solana/program";
import { PRACTICE_JAR_OWNER } from "@/lib/solana/raid";
import { useCrumbJarProgram } from "@/lib/solana/useCrumbJarProgram";
import { settledCrumbs, type CookieJarState } from "./useCookieJar";
import { useNowSeconds } from "./useNowSeconds";

const REFRESH_INTERVAL_MS = 15_000;

/** Live total for the permanent practice target, so its card can show a real, ticking number. */
export function usePracticeJar() {
  const program = useCrumbJarProgram();
  const nowSeconds = useNowSeconds();
  const [jar, setJar] = useState<CookieJarState | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      program.account.cookieJar
        .fetchNullable(getJarPda(PRACTICE_JAR_OWNER))
        .then((account) => {
          if (!cancelled) setJar(account as CookieJarState | null);
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
  }, [program]);

  if (!jar) return { total: null };
  return { total: settledCrumbs(jar, nowSeconds).total };
}
