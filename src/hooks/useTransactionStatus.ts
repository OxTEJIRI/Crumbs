"use client";

import { useCallback, useState } from "react";
import { Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useTransactionToasts } from "@/components/tx/TransactionToasts";

export type TxStatus = "idle" | "pending" | "confirming" | "confirmed" | "failed";

export function describeError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (/user rejected|rejected the request|User denied/i.test(message)) {
    return "You rejected the signature request.";
  }
  // Wallets that broadcast transactions themselves (rather than just
  // signing) use their own configured network, not necessarily this app's —
  // if that's set to Solana instead of Cookie Chain, the send fails with
  // exactly this generic message and no further detail.
  if (/^failed to send transaction/i.test(message)) {
    return "Failed to send the transaction. If your wallet is set to a different network than Cookie Chain, switch it to Cookie Chain (RPC https://rpc.cookiescan.io) and try again.";
  }
  if (/insufficient (lamports|funds)/i.test(message)) {
    return "Not enough COOK to pay for this transaction.";
  }
  if (/already in use/i.test(message)) {
    return "You already have one of these open.";
  }
  if (/blockhash not found|block height exceeded/i.test(message)) {
    return "Transaction expired before confirming. Please try again.";
  }
  if (/SelfRaid/.test(message)) {
    return "You can't raid your own jar.";
  }
  if (/RaidOnCooldown/.test(message)) {
    return "Your raid is still on cooldown.";
  }
  if (/InsufficientCrumbs/.test(message)) {
    return "You don't have enough crumbs to stake this raid.";
  }
  if (/RevealTooSoon/.test(message)) {
    return "The chain hasn't advanced far enough yet. Try again in a moment.";
  }
  if (/InvalidReveal/.test(message)) {
    return "That secret doesn't match your commitment.";
  }
  if (/WrongTarget/.test(message)) {
    return "That isn't the jar you committed to raid.";
  }
  if (/SubmittedTooSoon/.test(message)) {
    return "Play a little longer before submitting a score.";
  }
  if (/ScoreImplausible/.test(message)) {
    return "That score isn't plausible for how long you played.";
  }
  if (/CookieAlreadyLive/.test(message)) {
    return "There's already a cookie in the oven. Wait for this batch to end.";
  }
  if (/CookieNotLive/.test(message)) {
    return "That batch is already over. Refresh to see the new oven.";
  }
  if (/BakeTooSmall/.test(message)) {
    return "That's below the minimum bake.";
  }
  if (/BidTooSmall/.test(message)) {
    return "That bite is below the minimum bid.";
  }
  if (/BakerLocked/.test(message)) {
    return "You just baked this cookie. Wait a few slots before biting it.";
  }
  if (/NotTheBaker/.test(message)) {
    return "Only the baker of this batch can do that.";
  }
  if (/NotIdleYet/.test(message)) {
    return "The oven isn't idle yet. There's nothing to stoke.";
  }
  if (/GlazeCostExceeded/.test(message)) {
    return "The cookie heated up before that landed, so glazing got more expensive. Try again.";
  }
  return message;
}

/**
 * Drives one transaction through signature and confirmation, reporting every
 * step as a toast. Callers keep the returned status only to disable buttons
 * while their own transaction is in flight, and the resolved boolean to
 * decide whether it's safe to assume the transaction's effects happened.
 */
export function useTransactionStatus() {
  const { connection } = useConnection();
  const { sendTransaction } = useWallet();
  const toasts = useTransactionToasts();

  const [status, setStatus] = useState<TxStatus>("idle");

  const run = useCallback(
    async (
      label: string,
      buildTransaction: () => Promise<Transaction>,
      onConfirmed?: (signature: string) => Promise<void>
    ): Promise<boolean> => {
      const toastId = toasts.push(label);
      setStatus("pending");

      try {
        const transaction = await buildTransaction();

        const signature = await sendTransaction(transaction, connection);
        setStatus("confirming");
        toasts.update(toastId, { status: "confirming", signature });

        const latestBlockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          { signature, ...latestBlockhash },
          "confirmed"
        );

        setStatus("confirmed");
        toasts.update(toastId, { status: "confirmed", signature });
        await onConfirmed?.(signature);
        return true;
      } catch (err) {
        // Wallet-adapter's own error often wraps a more specific cause the
        // extension threw (e.g. Nightly's injected script) that the
        // dev overlay truncates by default — log it separately so it's
        // actually visible.
        console.error(
          "Transaction failed:",
          err,
          (err as { error?: unknown })?.error
        );
        setStatus("failed");
        toasts.update(toastId, {
          status: "failed",
          error: describeError(err),
        });
        return false;
      }
    },
    [sendTransaction, connection, toasts]
  );

  return { status, run };
}
