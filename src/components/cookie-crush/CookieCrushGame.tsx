"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCookieCrushSession } from "@/hooks/useCookieCrushSession";
import { useCookieJar, useLiveCrumbs } from "@/hooks/useCookieJar";
import {
  BOOST_COST_CRUMBS,
  BOOST_EXTRA_SECONDS,
} from "@/lib/solana/cookieCrush";
import Board from "./Board";
import CookieCrushLeaderboard from "./CookieCrushLeaderboard";

const LEVEL_ID = 1;
const ROUND_SECONDS = 60;

/**
 * "Round over" is derived from secondsLeft rather than stored as its own
 * phase, so the countdown effect never needs to call setState synchronously
 * from its own body — it just stops scheduling the next tick.
 */
type Phase = "idle" | "playing";

export default function CookieCrushGame() {
  const { publicKey } = useWallet();
  const { inSession, bestScore, status, error, startLevel, submitScore } =
    useCookieCrushSession(LEVEL_ID);

  const { jar, balance } = useCookieJar();
  const { banked } = useLiveCrumbs(jar, balance);

  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [boardKey, setBoardKey] = useState(0);
  const [boost, setBoost] = useState(false);

  // Only claimed crumbs can be spent -- what's still accruing hasn't been
  // minted yet, so the chain would reject it.
  const canAffordBoost = Boolean(jar?.migrated) && banked >= BOOST_COST_CRUMBS;

  const busy = status === "pending" || status === "confirming";
  const hasStaleSession = inSession && phase === "idle";
  const roundActive = phase === "playing" && secondsLeft > 0;
  const roundOver = phase === "playing" && secondsLeft <= 0;

  useEffect(() => {
    if (!roundActive) return;
    // Re-runs on every tick (secondsLeft in the deps), not just when
    // roundActive itself flips — otherwise the timer fires once and stalls.
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [roundActive, secondsLeft]);

  const handleStart = useCallback(async () => {
    const paying = boost && canAffordBoost;
    const ok = await startLevel(paying);
    if (!ok) return;

    setScore(0);
    setSecondsLeft(ROUND_SECONDS + (paying ? BOOST_EXTRA_SECONDS : 0));
    setBoardKey((k) => k + 1);
    setPhase("playing");
  }, [startLevel, boost, canAffordBoost]);

  const handleScore = useCallback((points: number) => {
    setScore((s) => s + points);
  }, []);

  const handleSubmit = useCallback(async () => {
    const ok = await submitScore(score);
    if (ok) setPhase("idle");
  }, [submitScore, score]);

  const handleCloseStale = useCallback(async () => {
    await submitScore(0);
  }, [submitScore]);

  if (!publicKey) {
    return (
      <p className="text-center text-muted">
        Connect your wallet to play Cookie Crush.
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex-1">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-display text-2xl font-semibold tabular-nums">
                {score.toLocaleString()}
              </span>
              {phase === "playing" && (
                <span className="rounded-full bg-background px-3 py-1 font-mono text-sm tabular-nums text-muted">
                  {secondsLeft}s
                </span>
              )}
            </div>
            {bestScore && (
              <span className="text-sm text-muted">
                Best:{" "}
                <span className="font-mono text-foreground">
                  {bestScore.bestScore.toLocaleString()}
                </span>
              </span>
            )}
          </div>

          {roundActive ? (
            <Board key={boardKey} onScore={handleScore} />
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-border text-6xl">
              {roundOver ? "⏰" : "🍪"}
            </div>
          )}

          {hasStaleSession ? (
            <div className="flex flex-col gap-2 rounded-xl bg-danger-surface p-4 text-sm">
              <p>
                You have an unfinished session from before. Close it to start
                a new one.
              </p>
              <button
                onClick={handleCloseStale}
                disabled={busy}
                className="h-10 w-fit rounded-full bg-danger px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {busy ? "Closing…" : "Close old session"}
              </button>
            </div>
          ) : phase === "idle" ? (
            <div className="flex flex-col gap-3">
              {canAffordBoost && (
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background/60 p-4 text-sm transition-colors hover:border-primary/40">
                  <input
                    type="checkbox"
                    checked={boost}
                    onChange={(e) => setBoost(e.target.checked)}
                    disabled={busy}
                    className="h-4 w-4 shrink-0 accent-primary"
                  />
                  <span className="flex-1">
                    Play {ROUND_SECONDS + BOOST_EXTRA_SECONDS}s instead of{" "}
                    {ROUND_SECONDS}s for{" "}
                    <span className="font-mono">{BOOST_COST_CRUMBS}</span>{" "}
                    crumbs
                    <span className="block text-xs text-muted">
                      You have {banked.toLocaleString()} claimed. They&apos;re
                      burned, not paid to anyone.
                    </span>
                  </span>
                </label>
              )}
              <button
                onClick={handleStart}
                disabled={busy}
                className="h-12 w-full rounded-full bg-primary px-5 font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {busy
                  ? "Starting…"
                  : boost && canAffordBoost
                    ? `Start ${ROUND_SECONDS + BOOST_EXTRA_SECONDS}s level for ${BOOST_COST_CRUMBS} crumbs`
                    : "Start level"}
              </button>
            </div>
          ) : roundOver ? (
            <button
              onClick={handleSubmit}
              disabled={busy}
              className="h-12 w-full rounded-full bg-primary px-5 font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {busy ? "Submitting…" : `Submit score: ${score.toLocaleString()}`}
            </button>
          ) : null}

          {error && (
            <p className="text-center text-sm text-danger">{error}</p>
          )}
        </div>
      </div>

      <div className="w-full lg:w-[360px] lg:shrink-0">
        <CookieCrushLeaderboard levelId={LEVEL_ID} />
      </div>
    </div>
  );
}
