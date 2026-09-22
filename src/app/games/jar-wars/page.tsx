"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import Header from "@/components/layout/Header";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import JarPanel from "@/components/jar/JarPanel";
import Leaderboard from "@/components/jar/Leaderboard";
import JarIcon from "@/components/jar/JarIcon";
import { useCookieJar, useLiveCrumbs } from "@/hooks/useCookieJar";

function GameSubHeader() {
  const { publicKey } = useWallet();
  const { jar } = useCookieJar();
  const { total } = useLiveCrumbs(jar);

  return (
    <div className="border-b border-border/60 bg-surface/60">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <span aria-hidden>←</span> All games
        </Link>

        <div className="flex items-center gap-2">
          <JarIcon className="h-5 w-5 shrink-0" />
          <span className="font-display font-semibold">Jar Wars</span>
        </div>

        {publicKey && jar ? (
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-sm font-medium">
            <span aria-hidden>🍪</span>
            <span className="font-mono tabular-nums">
              {total.toLocaleString()}
            </span>
          </div>
        ) : (
          <span className="w-[88px]" aria-hidden />
        )}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <JarIcon className="h-24 w-24" />
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-5xl font-bold uppercase tracking-tight sm:text-6xl">
          Jar Wars
        </h1>
        <p className="max-w-md text-lg text-muted">
          Every player owns a Cookie Jar that earns $CRUMB automatically,
          second by second. Claim it, grow it, and raid other players&apos;
          jars to steal theirs.
        </p>
      </div>
      <WalletConnectButton />
      <ol className="mt-4 grid max-w-2xl grid-cols-2 gap-6 text-sm text-muted sm:grid-cols-4">
        <li className="flex flex-col items-center gap-1">
          <JarIcon className="h-8 w-8" />
          <span className="font-medium text-foreground">1. Mint a jar</span>
          <span>One-time setup</span>
        </li>
        <li className="flex flex-col items-center gap-1">
          <span aria-hidden className="text-2xl">
            ⏱️
          </span>
          <span className="font-medium text-foreground">2. Claim crumbs</span>
          <span>They accrue on their own</span>
        </li>
        <li className="flex flex-col items-center gap-1">
          <span aria-hidden className="text-2xl">
            🏆
          </span>
          <span className="font-medium text-foreground">3. Find a rival</span>
          <span>Pick anyone off the leaderboard</span>
        </li>
        <li className="flex flex-col items-center gap-1">
          <span aria-hidden className="text-2xl">
            ⚔️
          </span>
          <span className="font-medium text-foreground">4. Raid them</span>
          <span>Win their crumbs, or lose your stake</span>
        </li>
      </ol>
    </div>
  );
}

function Dashboard() {
  const [raidTarget, setRaidTarget] = useState("");

  const handleRaidPick = (address: string) => {
    setRaidTarget(address);
    document
      .getElementById("raid-panel")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10 lg:flex-row lg:items-start">
      <div className="flex-1">
        <JarPanel
          raidTarget={raidTarget}
          onRaidTargetChange={setRaidTarget}
        />
      </div>
      <div className="w-full lg:w-[360px] lg:shrink-0">
        <Leaderboard onRaid={handleRaidPick} />
      </div>
    </div>
  );
}

export default function JarWarsPage() {
  const { publicKey } = useWallet();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Header />
      <GameSubHeader />
      <main className="flex flex-1 flex-col">
        {publicKey ? <Dashboard /> : <Hero />}
      </main>
    </div>
  );
}
