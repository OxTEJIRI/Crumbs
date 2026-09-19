"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCookieJar, useLiveCrumbs } from "@/hooks/useCookieJar";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";

export default function Header() {
  const { publicKey } = useWallet();
  const { jar } = useCookieJar();
  const { total } = useLiveCrumbs(jar);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍪</span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Crumbs
          </span>
        </div>

        <div className="flex items-center gap-3">
          {publicKey && jar && (
            <div className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium sm:flex">
              <span aria-hidden>🍪</span>
              <span className="font-mono tabular-nums">
                {total.toLocaleString()}
              </span>
            </div>
          )}
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
