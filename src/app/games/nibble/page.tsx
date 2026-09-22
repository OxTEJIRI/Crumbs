"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import Header from "@/components/layout/Header";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import NibbleOven from "@/components/nibble/NibbleOven";

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
          <span aria-hidden>🍪</span>
          <span className="font-display font-semibold">Nibble</span>
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
        <span className="text-7xl">🍪</span>
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-5xl font-bold uppercase tracking-tight sm:text-6xl">
          Nibble
        </h1>
        <p className="max-w-md text-lg text-muted">
          One cookie. One pot. Everyone bites. Bake a cookie to start the pot,
          or pay to take a bite out of someone else&apos;s — the bite that
          finishes it takes what&apos;s left.
        </p>
      </div>
      <WalletConnectButton />
      <p className="max-w-sm text-sm text-muted">
        Nibble plays with real COOK. Every bake, bite and glaze is a live
        transaction.
      </p>
    </div>
  );
}

function HowToPlay() {
  return (
    <details className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <summary className="cursor-pointer font-display text-lg font-semibold">
        How Nibble works
      </summary>
      <div className="mt-4 flex flex-col gap-3 text-sm text-muted">
        <p>
          <span className="font-medium text-foreground">Bake.</span> Put COOK
          in to start a batch. That becomes the pot, and the cookie goes in at
          full health with a cold oven.
        </p>
        <p>
          <span className="font-medium text-foreground">Bite.</span> Anyone can
          pay to take a bite. Bigger bids do more damage, with diminishing
          returns, so no single bite can finish a healthy cookie. Your bid joins
          the pot and you get a share of crumbs back immediately — always less
          than you paid. You&apos;re buying a chance at the ending.
        </p>
        <p>
          <span className="font-medium text-foreground">The ending.</span>{" "}
          Whoever lands the bite that takes the last of the cookie wins whatever
          is left in the pot.
        </p>
        <p>
          <span className="font-medium text-foreground">Heat.</span> Every bite
          heats the oven, and so does leaving it alone. If heat maxes out, the
          cookie burns and the whole pot goes to the jar — nobody wins.
        </p>
        <p>
          <span className="font-medium text-foreground">
            The baker&apos;s choice.
          </span>{" "}
          Only the baker can glaze (cooling the oven and restoring some cookie,
          for a price that climbs steeply with heat) or pull the cookie out
          early and bank the pot. Wait too long and it burns instead.
        </p>
      </div>
    </details>
  );
}

export default function NibblePage() {
  const { publicKey } = useWallet();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Header />
      <GameSubHeader />
      <main className="flex flex-1 flex-col">
        {publicKey ? (
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
            <NibbleOven />
            <HowToPlay />
          </div>
        ) : (
          <Hero />
        )}
      </main>
    </div>
  );
}
