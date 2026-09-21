"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLuckySlice } from "@/hooks/useLuckySlice";
import CrumbMascot, { type MascotMood } from "./CrumbMascot";
import KnifeCookieScene from "./KnifeCookieScene";
import Scale from "./Scale";
import LuckySliceLeaderboard from "./LuckySliceLeaderboard";

const moodFor = (accuracyBps: number | null): MascotMood => {
  if (accuracyBps === null) return "idle";
  if (accuracyBps >= 9_000) return "happy";
  if (accuracyBps >= 6_000) return "neutral";
  return "sad";
};

export default function LuckySliceGame() {
  const { publicKey } = useWallet();
  const { stats, round, lastResult, status, error, startRound, submitCut } =
    useLuckySlice();

  const busy = status === "pending" || status === "confirming";
  // Swinging as soon as a round is confirmed and nothing's been cut from it
  // yet; submitCut clears `round` immediately on success, which stops it.
  const swinging = round !== null && !busy;

  // Remounting KnifeCookieScene on every new round (via key) resets its
  // internal tapped-position state for free, rather than needing an effect
  // inside it to reset on `swinging` — a synchronous setState in an effect
  // body is exactly the pattern that caused Cookie Crush's timer bug.
  const [roundToken, setRoundToken] = useState(0);

  const handleStart = () => {
    setRoundToken((t) => t + 1);
    startRound();
  };

  const handleCut = (actualBps: number) => {
    submitCut(actualBps);
  };

  if (!publicKey) {
    return (
      <p className="text-center text-muted">
        Connect your wallet to try your luck.
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex-1">
        <div className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-6">
            <CrumbMascot mood={moodFor(lastResult?.accuracyBps ?? null)} className="h-24 w-24" />
            <KnifeCookieScene
              key={roundToken}
              targetBps={round?.targetBps ?? null}
              swinging={swinging}
              frozenAtBps={lastResult?.actualBps ?? null}
              onCut={handleCut}
            />
          </div>

          {lastResult ? (
            <div className="flex flex-col items-center gap-3">
              <Scale actualBps={lastResult.actualBps} />
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm text-muted">Accuracy</span>
                <span className="font-display text-3xl font-semibold tabular-nums">
                  {(lastResult.accuracyBps / 100).toFixed(2)}%
                </span>
              </div>
            </div>
          ) : round ? (
            <p className="text-center text-sm text-muted">
              Target marked in green — tap the knife when it lines up.
            </p>
          ) : (
            <p className="text-center text-sm text-muted">
              Start a round to get a target, then tap the knife as it swings
              past it.
            </p>
          )}

          <button
            onClick={round ? undefined : handleStart}
            disabled={busy || !!round}
            className="h-12 w-full max-w-xs rounded-full bg-primary px-5 font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {busy
              ? "Working…"
              : round
                ? "Tap the cookie to cut"
                : lastResult
                  ? "Play again"
                  : "Start round"}
          </button>

          {stats && (
            <div className="flex w-full items-center justify-around rounded-2xl bg-background px-4 py-3 text-sm">
              <div className="flex flex-col items-center">
                <span className="text-muted">Best accuracy</span>
                <span className="font-mono font-semibold tabular-nums">
                  {(stats.bestAccuracyBps / 100).toFixed(2)}%
                </span>
              </div>
              <div className="h-8 w-px bg-border" aria-hidden />
              <div className="flex flex-col items-center">
                <span className="text-muted">Rounds played</span>
                <span className="font-mono font-semibold tabular-nums">
                  {stats.attempts.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {error && <p className="text-center text-sm text-danger">{error}</p>}
        </div>
      </div>

      <div className="w-full lg:w-[340px] lg:shrink-0">
        <LuckySliceLeaderboard />
      </div>
    </div>
  );
}
