"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  getRoundPda,
  getStatsPda,
  getWagerEscrowAta,
  WAGER_STAKE_CRUMBS,
} from "@/lib/solana/luckySlice";
import {
  CRUMB_JAR_PROGRAM_ID,
  CRUMB_MINT,
  getJarCrumbsAta,
  getJarPda,
} from "@/lib/solana/program";
import { useLuckySliceProgram } from "@/lib/solana/useLuckySliceProgram";
import { describeError, useTransactionStatus } from "./useTransactionStatus";

export interface SliceStatsState {
  bestAccuracyBps: number;
  attempts: number;
}

export interface RoundState {
  targetBps: number;
  wagered: boolean;
}

export interface CutResult {
  actualBps: number;
  accuracyBps: number;
}

async function readFromLogs(
  connection: ReturnType<typeof useConnection>["connection"],
  signature: string,
  pattern: RegExp
): Promise<number | null> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const detail = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const line = detail?.meta?.logMessages?.join("\n");
    if (line) {
      const match = line.match(pattern);
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

  const statsPda = useMemo(
    () => (publicKey ? getStatsPda(publicKey) : null),
    [publicKey]
  );
  const roundPda = useMemo(
    () => (publicKey ? getRoundPda(publicKey) : null),
    [publicKey]
  );

  const [stats, setStats] = useState<SliceStatsState | null>(null);
  const [round, setRound] = useState<RoundState | null>(null);
  const [lastResult, setLastResult] = useState<CutResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (): Promise<SliceStatsState | null> => {
    if (!statsPda) return null;
    const account = await program.account.sliceStats.fetchNullable(statsPda);
    if (!account) return null;
    return {
      bestAccuracyBps: account.bestAccuracyBps,
      attempts: account.attempts.toNumber(),
    };
  }, [program, statsPda]);

  const fetchRound = useCallback(async (): Promise<RoundState | null> => {
    if (!roundPda) return null;
    const account = await program.account.round.fetchNullable(roundPda);
    if (!account) return null;
    return { targetBps: account.targetBps, wagered: account.wagered };
  }, [program, roundPda]);

  const refresh = useCallback(async () => {
    try {
      const [nextStats, nextRound] = await Promise.all([
        fetchStats(),
        fetchRound(),
      ]);
      setStats(nextStats);
      setRound(nextRound);
    } catch (err) {
      setError(describeError(err));
    }
  }, [fetchStats, fetchRound]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchStats(), fetchRound()])
      .then(([nextStats, nextRound]) => {
        if (cancelled) return;
        setStats(nextStats);
        setRound(nextRound);
      })
      .catch((err) => {
        if (!cancelled) setError(describeError(err));
      });

    return () => {
      cancelled = true;
    };
  }, [fetchStats, fetchRound]);

  const startRound = useCallback(
    async (wager = false) => {
      if (!publicKey) return false;

      setLastResult(null);
      const jar = getJarPda(publicKey);
      const roundAccount = getRoundPda(publicKey);
      // Anchor rejects a mix of set and unset optional accounts, so a free
      // round passes null for every one of them.
      const wagerAccounts = wager
        ? {
            jar,
            crumbMint: CRUMB_MINT,
            jarCrumbs: getJarCrumbsAta(jar),
            wagerEscrow: getWagerEscrowAta(roundAccount),
            crumbJarProgram: CRUMB_JAR_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          }
        : {
            jar: null,
            crumbMint: null,
            jarCrumbs: null,
            wagerEscrow: null,
            crumbJarProgram: null,
            tokenProgram: null,
            associatedTokenProgram: null,
          };

      return run(
        wager
          ? `Staking ${WAGER_STAKE_CRUMBS} crumbs on this cut`
          : "Starting a round",
        () =>
          program.methods
            .startRound(wager)
            .accountsPartial({ player: publicKey, ...wagerAccounts })
            .transaction(),
        async (signature) => {
          const targetBps = await readFromLogs(
            connection,
            signature,
            /target (\d+)bps/
          );
          if (targetBps !== null) {
            setRound({ targetBps, wagered: wager });
          }
          await refresh();
        }
      );
    },
    [program, publicKey, run, refresh, connection]
  );

  const submitCut = useCallback(
    async (actualBps: number) => {
      if (!publicKey) return false;

      // Settling a staked round needs the escrow accounts; the program reads
      // `wagered` off the round itself, so these have to match what it finds.
      const jar = getJarPda(publicKey);
      const settleAccounts = round?.wagered
        ? {
            crumbMint: CRUMB_MINT,
            jarCrumbs: getJarCrumbsAta(jar),
            wagerEscrow: getWagerEscrowAta(getRoundPda(publicKey)),
            tokenProgram: TOKEN_PROGRAM_ID,
          }
        : {
            crumbMint: null,
            jarCrumbs: null,
            wagerEscrow: null,
            tokenProgram: null,
          };

      return run(
        "Submitting your cut",
        () =>
          program.methods
            .submitCut(actualBps)
            .accountsPartial({ player: publicKey, ...settleAccounts })
            .transaction(),
        async (signature) => {
          const accuracyBps = await readFromLogs(
            connection,
            signature,
            /(\d+)bps accuracy/
          );
          setLastResult({
            actualBps,
            accuracyBps: accuracyBps ?? 0,
          });
          setRound(null);
          await refresh();
        }
      );
    },
    [program, publicKey, run, refresh, connection, round]
  );

  return {
    stats,
    round,
    lastResult,
    status,
    error,
    startRound,
    submitCut,
  };
}
