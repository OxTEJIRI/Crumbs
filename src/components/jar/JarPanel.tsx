"use client";

import { useCookieJar, useLiveCrumbs } from "@/hooks/useCookieJar";
import JarVisual from "./JarVisual";
import RaidPanel from "./RaidPanel";

export default function JarPanel({
  raidTarget,
  onRaidTargetChange,
}: {
  raidTarget: string;
  onRaidTargetChange: (value: string) => void;
}) {
  const { jar, loading, status, error, mintJar, claimCrumbs, refresh } =
    useCookieJar();
  const { banked, pending, total } = useLiveCrumbs(jar);

  const busy = status === "pending" || status === "confirming";

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        {loading && !jar ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="h-28 w-28 animate-pulse rounded-full bg-border/60" />
            <p className="text-sm text-muted">Checking for your jar…</p>
          </div>
        ) : jar ? (
          <>
            <div className="flex w-full items-center gap-5 sm:gap-6">
              <JarVisual crumbs={total} />
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm text-muted">Your crumbs</span>
                <span className="font-display text-4xl font-semibold tabular-nums sm:text-5xl">
                  {total.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="w-full text-sm text-muted">
              Your jar earns crumbs automatically, every second, whether
              you&apos;re here or not — claiming just banks what&apos;s
              piled up so far into your permanent balance.
            </p>

            <dl className="grid w-full grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-background/60 p-4 text-sm">
              <dt className="text-muted">In the jar</dt>
              <dd className="text-right font-mono tabular-nums">
                {banked.toLocaleString()}
              </dd>
              <dt className="text-muted">Unclaimed</dt>
              <dd className="text-right font-mono tabular-nums text-primary">
                {pending.toLocaleString()}
              </dd>
              <dt className="text-muted">Production rate</dt>
              <dd className="text-right font-mono tabular-nums">
                {jar.productionRate.toString()}/s
              </dd>
              <dt className="text-muted">Defense level</dt>
              <dd className="text-right font-mono tabular-nums">
                {jar.defenseLevel}
              </dd>
            </dl>

            <button
              onClick={claimCrumbs}
              disabled={busy || pending === 0}
              className="h-12 w-full rounded-full bg-primary px-5 font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
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
            <JarVisual crumbs={0} />
            <p className="text-center text-muted">
              You don&apos;t have a Cookie Jar yet.
            </p>
            <button
              onClick={mintJar}
              disabled={busy}
              className="h-12 w-full rounded-full bg-primary px-5 font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {busy ? "Minting…" : "Mint your Cookie Jar"}
            </button>
          </>
        )}

        {error && (
          <p className="text-center text-sm text-danger">{error}</p>
        )}
      </div>

      {jar && (
        <RaidPanel
          onJarChanged={refresh}
          target={raidTarget}
          onTargetChange={onRaidTargetChange}
        />
      )}
    </div>
  );
}
