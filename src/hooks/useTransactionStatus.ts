"use client";

import { useCallback, useState } from "react";
import { Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

export type TxStatus = "idle" | "pending" | "confirming" | "confirmed" | "failed";

export function describeError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (/user rejected|rejected the request|User denied/i.test(message)) {
    return "You rejected the signature request.";
  }
  if (/insufficient (lamports|funds)/i.test(message)) {
    return "Not enough SOL to pay for this transaction.";
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
  return message;
}

/**
 * Drives one transaction at a time through signature, confirmation and the
 * failure states the UI reports, so each panel can own its own progress.
 */
export function useTransactionStatus() {
  const { connection } = useConnection();
  const { sendTransaction } = useWallet();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (
      buildTransaction: () => Promise<Transaction>,
      onConfirmed?: (signature: string) => Promise<void>
    ) => {
      setError(null);
      setSignature(null);
      setStatus("pending");

      try {
        const transaction = await buildTransaction();

        const sig = await sendTransaction(transaction, connection);
        setSignature(sig);
        setStatus("confirming");

        const latestBlockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          { signature: sig, ...latestBlockhash },
          "confirmed"
        );

        setStatus("confirmed");
        await onConfirmed?.(sig);
      } catch (err) {
        setError(describeError(err));
        setStatus("failed");
      }
    },
    [sendTransaction, connection]
  );

  return { status, signature, error, run };
}
