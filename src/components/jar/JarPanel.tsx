"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCookieJar, useLiveCrumbs } from "@/hooks/useCookieJar";
import { COOKIESCAN_TX_URL } from "@/lib/solana/config";
import RaidPanel from "./RaidPanel";

const STATUS_LABELS: Record<string, string> = {
  pending: "Waiting for your signature…",
  confirming: "Confirming on Cookie Chain…",
  confirmed: "Confirmed!",
  failed: "Transaction failed",
};

export default function JarPanel() {
  const { publicKey } = useWallet();
  const {
    jar,
    loading,
    status,
    signature,
    error,
    mintJar,
    claimCrumbs,
    refresh,
  } = useCookieJar();
  const { banked, pending, total } = useLiveCrumbs(jar);

  if (!publicKey) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Connect your wallet to bake your first jar.
      </p>
    );
  }

  const busy = status === "pending" || status === "confirming";

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
    <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-black/[.08] p-6 dark:border-white/[.145]">
      {loading && !jar ? (
        <p className="text-zinc-600 dark:text-zinc-400">Checking for your jar…</p>
      ) : jar ? (
        <>
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-4xl tabular-nums">
              {total.toLocaleString()}
            </span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              crumbs
            </span>
          </div>

          <dl className="grid w-full grid-cols-2 gap-3 text-sm">
            <dt className="text-zinc-600 dark:text-zinc-400">In the jar</dt>
            <dd className="text-right font-mono tabular-nums">
              {banked.toLocaleString()}
            </dd>
            <dt className="text-zinc-600 dark:text-zinc-400">Unclaimed</dt>
            <dd className="text-right font-mono tabular-nums">
              {pending.toLocaleString()}
            </dd>
            <dt className="text-zinc-600 dark:text-zinc-400">Production rate</dt>
            <dd className="text-right font-mono tabular-nums">
              {jar.productionRate.toString()}/s
            </dd>
            <dt className="text-zinc-600 dark:text-zinc-400">Defense level</dt>
            <dd className="text-right font-mono tabular-nums">
              {jar.defenseLevel}
            </dd>
          </dl>

          <button
            onClick={claimCrumbs}
            disabled={busy || pending === 0}
            className="h-12 w-full rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {busy
              ? "Claiming…"
              : pending === 0
                ? "Nothing to claim yet"
                : `Claim ${pending.toLocaleString()} crumbs`}
          </button>
        </>
      ) : (
        <>
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            You don&apos;t have a Cookie Jar yet.
          </p>
          <button
            onClick={mintJar}
            disabled={busy}
            className="h-12 w-full rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {busy ? "Minting…" : "Mint your Cookie Jar"}
          </button>
        </>
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

    {jar && <RaidPanel onJarChanged={refresh} />}
    </div>
  );
}
