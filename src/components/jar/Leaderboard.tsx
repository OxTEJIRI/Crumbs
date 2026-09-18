"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";

const truncate = (address: string) =>
  `${address.slice(0, 4)}…${address.slice(-4)}`;

export default function Leaderboard() {
  const { publicKey } = useWallet();
  const { entries, loading, error } = useLeaderboard();

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-black/[.08] p-6 dark:border-white/[.145]">
      <h2 className="text-lg font-semibold">Richest jars</h2>

      {loading && entries.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Reading jars from Cookie Chain…
        </p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No jars on chain yet. Mint the first one.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {entries.map((entry, index) => {
            const isYou = publicKey?.equals(entry.owner) ?? false;

            return (
              <li
                key={entry.jar.toString()}
                className={`flex items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                  isYou
                    ? "bg-black/[.06] font-medium dark:bg-white/[.10]"
                    : ""
                }`}
              >
                <span className="w-5 shrink-0 text-zinc-600 tabular-nums dark:text-zinc-400">
                  {index + 1}
                </span>
                <span className="flex-1 truncate font-mono">
                  {truncate(entry.owner.toString())}
                  {isYou && " (you)"}
                </span>
                <span className="shrink-0 text-zinc-600 tabular-nums dark:text-zinc-400">
                  def {entry.defenseLevel}
                </span>
                <span className="w-24 shrink-0 text-right font-mono tabular-nums">
                  {entry.crumbs.toLocaleString()}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
