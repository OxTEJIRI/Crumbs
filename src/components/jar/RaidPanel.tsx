"use client";

import { useState } from "react";
import { useRaid } from "@/hooks/useRaid";

export default function RaidPanel({
  onJarChanged,
}: {
  onJarChanged?: () => Promise<void>;
}) {
  const [target, setTarget] = useState("");
  const { raid, canReveal, outcome, status, error, commitRaid, revealRaid } =
    useRaid(onJarChanged);

  const busy = status === "pending" || status === "confirming";

  return (
    <div className="flex w-full flex-col gap-4 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
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
              nobody — including you — can know it in advance.
            </p>
          )}
        </>
      ) : (
        <>
          <input
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="Target wallet address"
            spellCheck={false}
            className="h-12 w-full rounded-full border border-border bg-background px-5 font-mono text-sm outline-none transition-colors focus:border-primary"
          />
          <button
            onClick={() => commitRaid(target)}
            disabled={busy || target.trim().length === 0}
            className="h-12 w-full rounded-full bg-primary px-5 font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {busy ? "Committing…" : "Commit raid (stakes 10 crumbs)"}
          </button>
        </>
      )}

      {outcome && (
        <p className="text-center text-sm font-medium text-foreground">
          {outcome}
        </p>
      )}

      {error && <p className="text-center text-sm text-danger">{error}</p>}
    </div>
  );
}
