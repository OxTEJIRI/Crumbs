"use client";

import { useState } from "react";
import { COOKIE_CHAIN_RPC_ENDPOINT } from "@/lib/solana/config";

/**
 * Wallets that broadcast transactions themselves (Nightly included) use
 * their own configured network, not necessarily this app's — if that's set
 * to Solana instead of Cookie Chain, every transaction fails with an opaque
 * "Failed to send transaction" and no further detail (see
 * useTransactionStatus's describeError for the after-the-fact message).
 * This surfaces the fix before anyone hits that failure at all.
 */
export default function NetworkSetupNote() {
  const [copied, setCopied] = useState(false);

  const copyRpc = async () => {
    try {
      await navigator.clipboard.writeText(COOKIE_CHAIN_RPC_ENDPOINT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied; the RPC is still shown as text.
    }
  };

  return (
    <details className="group relative">
      <summary className="cursor-pointer list-none text-xs text-muted transition-colors hover:text-foreground">
        Using Nightly?{" "}
        <span className="underline decoration-dotted underline-offset-2">
          Add Cookie Chain first
        </span>
      </summary>

      <div className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-surface p-4 text-sm shadow-md sm:left-auto sm:right-0">
        <p className="text-muted">
          Nightly needs Cookie Chain added as a custom network before it can
          sign and send here — otherwise it silently tries your wallet&apos;s
          default network instead.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
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
        <p className="mt-3 text-xs text-muted">
          Add it as a custom network in Nightly&apos;s settings, switch to it,
          then connect.
        </p>
      </div>
    </details>
  );
}
