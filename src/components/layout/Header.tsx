"use client";

import Link from "next/link";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import NetworkSetupNote from "@/components/wallet/NetworkSetupNote";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🍪</span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Crumbs
          </span>
        </Link>

        {/* On mobile, the note drops to its own full-width line below the
            logo/wallet row instead of competing with them for space — that
            crowding was what pushed the wallet button too narrow to fit its
            own text on one line. Desktop keeps the original single row. */}
        <div className="order-3 w-full sm:order-none sm:w-auto">
          <NetworkSetupNote />
        </div>

        <WalletConnectButton />
      </div>
    </header>
  );
}
