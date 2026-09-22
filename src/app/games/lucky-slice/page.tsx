"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import Header from "@/components/layout/Header";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import LuckySliceGame from "@/components/lucky-slice/LuckySliceGame";
import CrumbMascot from "@/components/lucky-slice/CrumbMascot";

function GameSubHeader() {
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
          <CrumbMascot mood="idle" className="h-5 w-5 shrink-0" />
          <span className="font-display font-semibold">Lucky Slice</span>
        </div>

        <span className="w-[88px]" aria-hidden />
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="relative">
        <div
          aria-hidden
          className="animate-glow-pulse absolute inset-0 -z-10 rounded-full bg-primary/30 blur-3xl"
        />
        <CrumbMascot mood="happy" className="h-24 w-24" />
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-5xl font-bold uppercase tracking-tight sm:text-6xl">
          Lucky Slice
        </h1>
        <p className="max-w-md text-lg text-muted">
          A random target lands on the board, a knife swings over the
          cookie. Tap at the right moment to cut as close to it as you
          can. Climb the leaderboard on precision, not luck.
        </p>
      </div>
      <WalletConnectButton />
      <p className="max-w-sm text-sm text-muted">
        Free to play, no stakes, just bragging rights. Your target comes
        from a real on-chain transaction using Cookie Chain&apos;s own
        randomness, so nobody can pick an easy one.
      </p>
      <ol className="mt-4 grid max-w-2xl grid-cols-2 gap-6 text-sm text-muted sm:grid-cols-4">
        <li className="flex flex-col items-center gap-1">
          <span aria-hidden className="text-2xl">
            🎯
          </span>
          <span className="font-medium text-foreground">1. Start a round</span>
          <span>Rolls your target on-chain</span>
        </li>
        <li className="flex flex-col items-center gap-1">
          <span aria-hidden className="text-2xl">
            🔪
          </span>
          <span className="font-medium text-foreground">2. Time your tap</span>
          <span>The knife keeps swinging</span>
        </li>
        <li className="flex flex-col items-center gap-1">
          <span aria-hidden className="text-2xl">
            📝
          </span>
          <span className="font-medium text-foreground">3. Submit your cut</span>
          <span>Recorded on-chain</span>
        </li>
        <li className="flex flex-col items-center gap-1">
          <span aria-hidden className="text-2xl">
            🏆
          </span>
          <span className="font-medium text-foreground">4. Best accuracy wins</span>
          <span>Climb the leaderboard</span>
        </li>
      </ol>
    </div>
  );
}

export default function LuckySlicePage() {
  const { publicKey } = useWallet();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Header />
      <GameSubHeader />
      <main className="flex flex-1 flex-col">
        {publicKey ? (
          <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
            <LuckySliceGame />
          </div>
        ) : (
          <Hero />
        )}
      </main>
    </div>
  );
}
