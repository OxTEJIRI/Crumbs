"use client";

import { useState } from "react";
import { useRaid } from "@/hooks/useRaid";
import { COOKIESCAN_TX_URL } from "@/lib/solana/config";

const STATUS_LABELS: Record<string, string> = {
  pending: "Waiting for your signature…",
  confirming: "Confirming on Cookie Chain…",
  confirmed: "Confirmed!",
  failed: "Transaction failed",
};

export default function RaidPanel({
  onJarChanged,
}: {
  onJarChanged?: () => Promise<void>;
}) {
  const [target, setTarget] = useState("");
  const {
    raid,
    canReveal,
    outcome,
    status,
    signature,
    error,
    commitRaid,
    revealRaid,
  } = useRaid(onJarChanged);

  const busy = status === "pending" || status === "confirming";

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-black/[.08] p-6 dark:border-white/[.145]">
      <h2 className="self-start text-lg font-semibold">Raid a jar</h2>

      {raid ? (
        <>
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Raid committed against{" "}
            <span className="font-mono">
              {raid.target.toString().slice(0, 8)}…
            </span>
            . Reveal your secret to settle it.
          </p>
          <button
            onClick={revealRaid}
            disabled={busy || !canReveal}
            className="h-12 w-full rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {busy
              ? "Revealing…"
              : canReveal
                ? "Reveal raid"
                : "Waiting for the chain…"}
          </button>
          {!canReveal && (
            <p className="text-center text-xs text-zinc-600 dark:text-zinc-400">
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
            className="h-12 w-full rounded-full border border-black/[.08] bg-transparent px-5 font-mono text-sm outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40"
          />
          <button
            onClick={() => commitRaid(target)}
            disabled={busy || target.trim().length === 0}
            className="h-12 w-full rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {busy ? "Committing…" : "Commit raid (stakes 10 crumbs)"}
          </button>
        </>
      )}

      {outcome && (
        <p className="text-center text-sm font-medium">{outcome}</p>
      )}

      {status !== "idle" && (
        <p
          className={
            status === "failed"
              ? "text-sm text-red-600 dark:text-red-400"
              : "text-sm text-zinc-600 dark:text-zinc-400"
          }
        >
          {STATUS_LABELS[status]}
        </p>
      )}

      {error && (
        <p className="text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {signature && (
        <a
          href={`${COOKIESCAN_TX_URL}/${signature}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm underline underline-offset-4"
        >
          View on CookieScan
        </a>
      )}
    </div>
  );
}
