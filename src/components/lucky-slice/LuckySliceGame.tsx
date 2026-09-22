"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLuckySlice } from "@/hooks/useLuckySlice";
import { useCookieJar, useLiveCrumbs } from "@/hooks/useCookieJar";
import {
  BPS_DENOMINATOR,
  WAGER_ACCURACY_BPS,
  WAGER_STAKE_CRUMBS,
} from "@/lib/solana/luckySlice";
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
  const [wager, setWager] = useState(false);

  const { jar, balance } = useCookieJar();
  const { banked } = useLiveCrumbs(jar, balance);
  // Only claimed crumbs can be staked -- what's still accruing hasn't been
  // minted yet, so the chain would reject it.
  const canStake = Boolean(jar?.migrated) && banked >= WAGER_STAKE_CRUMBS;

  const handleStart = () => {
    setRoundToken((t) => t + 1);
    startRound(wager && canStake);
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
              <Scale pieceBps={BPS_DENOMINATOR - lastResult.actualBps} />
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm text-muted">Accuracy</span>
                <span className="font-display text-3xl font-semibold tabular-nums">
                  {(lastResult.accuracyBps / 100).toFixed(2)}%
                </span>
              </div>
            </div>
          ) : round ? (
            <p className="text-center text-sm text-muted">
              Target marked in green. Tap the knife when it lines up.
            </p>
          ) : (
            <p className="text-center text-sm text-muted">
              Start a round to get a target, then tap the knife as it swings
              past it.
            </p>
          )}

          {canStake && !round && (
            <label className="flex w-full max-w-xs cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background/60 p-4 text-sm transition-colors hover:border-primary/40">
              <input
                type="checkbox"
                checked={wager}
                onChange={(e) => setWager(e.target.checked)}
                disabled={busy}
                className="h-4 w-4 shrink-0 accent-primary"
              />
              <span className="flex-1">
                Stake <span className="font-mono">{WAGER_STAKE_CRUMBS}</span>{" "}
                crumbs on this cut
                <span className="block text-xs text-muted">
                  Land within {((BPS_DENOMINATOR - WAGER_ACCURACY_BPS) / 100).toFixed(0)}%
                  of the target and you get them back. Miss and they burn.
                </span>
              </span>
            </label>
          )}

          {round?.wagered && (
            <p className="text-center text-sm text-primary">
              {WAGER_STAKE_CRUMBS} crumbs staked. You need{" "}
              {(WAGER_ACCURACY_BPS / 100).toFixed(0)}% accuracy to keep them.
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
                : wager && canStake
                  ? `Start round, staking ${WAGER_STAKE_CRUMBS} crumbs`
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
