"use client";

import Link from "next/link";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🍪</span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Crumbs
          </span>
        </Link>

        <WalletConnectButton />
      </div>
    </header>
  );
}
