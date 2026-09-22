"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useWallet, type Wallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { COOKIE_CHAIN_RPC_ENDPOINT } from "@/lib/solana/config";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

/**
 * Nightly always sorts first, regardless of what other Wallet Standard
 * extensions a visitor has installed. The library's own
 * useStandardWalletAdapters hook always places auto-detected wallets ahead
 * of the ones we register explicitly, with no prop to change that -- so a
 * visitor with Phantom, Solflare, or any other Standard-compliant wallet
 * installed would otherwise see it listed before Nightly.
 */
function sortWallets(wallets: Wallet[]): Wallet[] {
  return [...wallets].sort((a, b) => {
    if (a.adapter.name === "Nightly") return -1;
    if (b.adapter.name === "Nightly") return 1;
    return 0;
  });
}

/**
 * Replaces the library's default connect modal (which has no way to inject
 * the network-setup steps, and no control over wallet ordering) with a
 * custom one. Only covers the disconnected state -- once connected, the
 * library's own button still handles the address/disconnect dropdown
 * unchanged.
 */
export default function WalletConnectButton() {
  const { wallets, select, connected, connecting } = useWallet();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  if (connected) {
    return <WalletMultiButtonDynamic />;
  }

  const openModal = () => dialogRef.current?.showModal();
  const closeModal = () => dialogRef.current?.close();

  const copyRpc = async () => {
    try {
      await navigator.clipboard.writeText(COOKIE_CHAIN_RPC_ENDPOINT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied; the RPC is still shown as text.
    }
  };

  const handleSelect = (walletName: Wallet["adapter"]["name"]) => {
    select(walletName);
    closeModal();
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={connecting}
        className="wallet-adapter-button wallet-adapter-button-trigger"
      >
        {connecting ? "Connecting..." : "Select Wallet"}
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal();
        }}
        className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 text-foreground shadow-lg backdrop:bg-black/50"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-lg font-semibold">
              Before you connect
            </h2>
            <p className="text-sm text-muted">
              Nightly needs Cookie Chain added as a custom network before it
              can sign and send here. Follow these steps.
            </p>
          </div>

          <ol className="flex flex-col gap-2 text-sm text-muted">
            <li>
              <span className="font-medium text-foreground">1.</span> Go to
              your Nightly wallet.
            </li>
            <li>
              <span className="font-medium text-foreground">2.</span> Click
              on the icon at the top right corner.
            </li>
            <li>
              <span className="font-medium text-foreground">3.</span> Scroll
              down and click &quot;Add new SVM&quot;.
            </li>
            <li>
              <span className="font-medium text-foreground">4.</span> Set the
              network name to Cookie Chain and use the RPC URL below.
            </li>
          </ol>

          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
            <code className="flex-1 truncate font-mono text-xs">
              {COOKIE_CHAIN_RPC_ENDPOINT}
            </code>
            <button
              type="button"
              onClick={copyRpc}
              className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <p className="text-xs text-muted">
            Do this first. Otherwise Crumbs silently tries your wallet&apos;s
            default network instead, and transactions fail with no clear
            reason.
          </p>

          <div className="flex flex-col gap-2 border-t border-border pt-4">
            {sortWallets(wallets).map((wallet) => (
              <button
                key={wallet.adapter.name}
                type="button"
                onClick={() => handleSelect(wallet.adapter.name)}
                className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-background"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- wallet icons are data URIs, not remote images next/image can optimize */}
                <img
                  src={wallet.adapter.icon}
                  alt=""
                  className="h-6 w-6 shrink-0"
                />
                <span className="flex-1">{wallet.adapter.name}</span>
                {wallet.readyState === WalletReadyState.Installed && (
                  <span className="text-xs text-success">Detected</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </dialog>
    </>
  );
}
