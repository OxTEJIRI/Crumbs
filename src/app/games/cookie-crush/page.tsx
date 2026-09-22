"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import Header from "@/components/layout/Header";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import CookieCrushGame from "@/components/cookie-crush/CookieCrushGame";

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
          <span aria-hidden>🍬</span>
          <span className="font-display font-semibold">Cookie Crush</span>
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
        <span className="text-7xl">🍬</span>
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-5xl font-bold uppercase tracking-tight sm:text-6xl">
          Cookie Crush
        </h1>
        <p className="max-w-md text-lg text-muted">
          Match 3 or more treats to score before time runs out. Start a
          level and submit your score on-chain — the board itself is all
          client-side, so it plays fast.
        </p>
      </div>
      <WalletConnectButton />
    </div>
  );
}

export default function CookieCrushPage() {
  const { publicKey } = useWallet();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Header />
      <GameSubHeader />
      <main className="flex flex-1 flex-col">
        {publicKey ? (
          <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
            <CookieCrushGame />
          </div>
        ) : (
          <Hero />
        )}
      </main>
    </div>
  );
}
