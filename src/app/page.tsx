"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import Header from "@/components/layout/Header";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import JarPanel from "@/components/jar/JarPanel";
import Leaderboard from "@/components/jar/Leaderboard";

function Hero() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <span className="text-7xl">🍪</span>
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
          Crumbs
        </h1>
        <p className="max-w-md text-lg text-muted">
          Bake. Hoard. Raid. Survive the Jar Wars — an on-chain
          idle-strategy game on Cookie Chain.
        </p>
      </div>
      <WalletConnectButton />
      <dl className="mt-4 grid max-w-lg grid-cols-3 gap-6 text-sm text-muted">
        <div className="flex flex-col items-center gap-1">
          <dt aria-hidden className="text-2xl">
            🫙
          </dt>
          <dd>Mint a jar</dd>
        </div>
        <div className="flex flex-col items-center gap-1">
          <dt aria-hidden className="text-2xl">
            ⏱️
          </dt>
          <dd>Earn crumbs</dd>
        </div>
        <div className="flex flex-col items-center gap-1">
          <dt aria-hidden className="text-2xl">
            ⚔️
          </dt>
          <dd>Raid rivals</dd>
        </div>
      </dl>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10 lg:flex-row lg:items-start">
      <div className="flex-1">
        <JarPanel />
      </div>
      <div className="w-full lg:w-[360px] lg:shrink-0">
        <Leaderboard />
      </div>
    </div>
  );
}

export default function Home() {
  const { publicKey } = useWallet();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        {publicKey ? <Dashboard /> : <Hero />}
      </main>
    </div>
  );
}
