"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useRaid } from "@/hooks/useRaid";
import { usePracticeJar } from "@/hooks/usePracticeJar";
import { PRACTICE_JAR_OWNER, getRaidStake } from "@/lib/solana/raid";

export default function RaidPanel({
  onJarChanged,
  target,
  onTargetChange,
}: {
  onJarChanged?: () => Promise<void>;
  target: string;
  onTargetChange: (value: string) => void;
}) {
  const { publicKey } = useWallet();
  const { raid, canReveal, outcome, status, error, commitRaid, revealRaid } =
    useRaid(onJarChanged);
  const { total: practiceTotal } = usePracticeJar();

  const busy = status === "pending" || status === "confirming";
  const stake = getRaidStake();
  const isPracticeTarget = publicKey?.equals(PRACTICE_JAR_OWNER) ?? false;

  return (
    <div
      id="raid-panel"
      className="flex w-full flex-col gap-4 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8"
    >
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <span aria-hidden>⚔️</span> Raid a jar
      </h2>

      {raid ? (
        <>
          <p className="text-center text-sm text-muted">
            Raid committed against{" "}
            <span className="font-mono text-foreground">
              {raid.target.toString().slice(0, 8)}…
            </span>
            . Reveal your secret to settle it.
          </p>
          <button
            onClick={revealRaid}
            disabled={busy || !canReveal}
            className="h-12 w-full rounded-full bg-primary px-5 font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {busy
              ? "Revealing…"
              : canReveal
                ? "Reveal raid"
                : "Waiting for the chain…"}
          </button>
          {!canReveal && (
            <p className="text-center text-xs text-muted">
              The outcome is drawn from a block produced after your commit, so
              nobody, including you, can know it in advance.
            </p>
          )}
        </>
      ) : (
        <>
          {!isPracticeTarget && (
            <button
              onClick={() => commitRaid(PRACTICE_JAR_OWNER.toString())}
              disabled={busy}
              className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex flex-col">
                <span className="text-sm font-medium">
                  🎯 Practice Jar, always here, always worth raiding
                </span>
                <span className="text-xs text-muted">
                  {practiceTotal !== null
                    ? `${practiceTotal.toLocaleString()} crumbs and climbing`
                    : "Loading…"}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                {busy ? "…" : "Quick raid"}
              </span>
            </button>
          )}

          <p className="text-sm text-muted">
            Or pick a rival from the leaderboard (click{" "}
            <strong>⚔️ Raid</strong> next to their name to fill this in), or
            paste their wallet address directly. Raiding costs {stake} crumbs
            upfront: win it back plus a cut of their jar, or lose it. The
            outcome is settled in a second step below, so nobody can know it
            in advance.
          </p>
          <input
            value={target}
            onChange={(event) => onTargetChange(event.target.value)}
            placeholder="Target wallet address"
            spellCheck={false}
            className="h-12 w-full rounded-full border border-border bg-background px-5 font-mono text-sm outline-none transition-colors focus:border-primary"
          />
          <button
            onClick={() => commitRaid(target)}
            disabled={busy || target.trim().length === 0}
            className="h-12 w-full rounded-full bg-primary px-5 font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {busy ? "Committing…" : `Commit raid (stakes ${stake} crumbs)`}
          </button>
        </>
      )}

      {outcome && (
        <div
          className={`rounded-2xl p-4 text-center ${
            outcome.succeeded ? "bg-success/10" : "bg-danger-surface"
          }`}
        >
          <p
            className={`font-display text-lg font-semibold ${
              outcome.succeeded ? "text-success" : "text-danger"
            }`}
          >
            {outcome.succeeded
              ? `🎉 You won ${outcome.looted.toLocaleString()} crumbs!`
              : "😬 Raid failed, you lost your stake"}
          </p>
          <p className="mt-1 text-xs text-muted">
            Rolled {outcome.roll} against a {outcome.threshold}% success
            threshold.
          </p>
        </div>
      )}

      {error && <p className="text-center text-sm text-danger">{error}</p>}
    </div>
  );
}
