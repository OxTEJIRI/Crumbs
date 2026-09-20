import { PublicKey } from "@solana/web3.js";
import type { Wallet } from "@anchor-lang/core";

/**
 * Stands in when nobody has connected yet so public reads — leaderboards
 * above all — still work. Every signing path guards on a real connected key
 * before it builds a transaction, so these are never reached.
 */
export const READ_ONLY_WALLET = {
  publicKey: PublicKey.default,
  signTransaction: () => Promise.reject(new Error("Wallet not connected")),
  signAllTransactions: () => Promise.reject(new Error("Wallet not connected")),
} as unknown as Wallet;
