"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCookieCrushLeaderboard } from "@/hooks/useCookieCrushLeaderboard";

const truncate = (address: string) =>
  `${address.slice(0, 4)}…${address.slice(-4)}`;

const RANK_MEDALS: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

export default function CookieCrushLeaderboard({
  levelId,
}: {
  levelId: number;
}) {
  const { publicKey } = useWallet();
  const { entries, loading, error } = useCookieCrushLeaderboard(levelId);

  return (
    <div className="flex w-full flex-col gap-4 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <span aria-hidden>🏆</span> Top scores
      </h2>

      {loading && entries.length === 0 ? (
        <ol className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-11 animate-pulse rounded-xl bg-background/60" />
          ))}
        </ol>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted">
          No scores yet. Be the first to play this level.
        </p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {entries.map((entry, index) => {
            const isYou = publicKey?.equals(entry.player) ?? false;

            return (
              <li
                key={entry.player.toString()}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isYou ? "bg-primary/10 font-medium" : "hover:bg-background/60"
                }`}
              >
                <span className="w-6 shrink-0 text-center tabular-nums">
                  {RANK_MEDALS[index] ?? (
                    <span className="text-muted">{index + 1}</span>
                  )}
                </span>
                <span className="flex-1 truncate font-mono">
                  {truncate(entry.player.toString())}
                  {isYou && <span className="ml-1.5 text-primary">(you)</span>}
                </span>
                <span className="hidden shrink-0 text-muted tabular-nums sm:inline">
                  {entry.attempts} tries
                </span>
                <span className="w-16 shrink-0 text-right font-mono tabular-nums">
                  {entry.bestScore.toLocaleString()}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
