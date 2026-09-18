"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import type { BN } from "@anchor-lang/core";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getJarPda } from "@/lib/solana/program";
import { useCrumbJarProgram } from "@/lib/solana/useCrumbJarProgram";
import {
  commitmentFor,
  forgetSecret,
  generateSecret,
  getRaidPda,
  recallSecret,
  rememberSecret,
} from "@/lib/solana/raid";
import { describeError, useTransactionStatus } from "./useTransactionStatus";

export interface RaidState {
  attacker: PublicKey;
  target: PublicKey;
  commitment: number[];
  commitSlot: BN;
  staked: BN;
  bump: number;
}

export function useRaid(onJarChanged?: () => Promise<void>) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const program = useCrumbJarProgram();
  const { status, signature, error, run } = useTransactionStatus();

  const [raid, setRaid] = useState<RaidState | null>(null);
  const [currentSlot, setCurrentSlot] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchRaid = useCallback(async (): Promise<RaidState | null> => {
    if (!program || !publicKey) return null;

    return (await program.account.raid.fetchNullable(
      getRaidPda(publicKey)
    )) as RaidState | null;
  }, [program, publicKey]);

  const refresh = useCallback(async () => {
    try {
      setRaid(await fetchRaid());
    } catch (err) {
      setFetchError(describeError(err));
    }
  }, [fetchRaid]);

  useEffect(() => {
    let cancelled = false;

    fetchRaid()
      .then((account) => {
        if (!cancelled) setRaid(account);
      })
      .catch((err) => {
        if (!cancelled) setFetchError(describeError(err));
      });

    return () => {
      cancelled = true;
    };
  }, [fetchRaid]);

  // The reveal is only accepted once a slot hash newer than the commit exists,
  // so poll the slot to know when the button can be enabled.
  useEffect(() => {
    if (!raid) return;

    let cancelled = false;
    const poll = () => {
      connection
        .getSlot("confirmed")
        .then((slot) => {
          if (!cancelled) setCurrentSlot(slot);
        })
        .catch(() => {
          // A dropped slot poll just delays enabling the button.
        });
    };

    poll();
    const id = setInterval(poll, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [raid, connection]);

  const commitRaid = useCallback(
    async (targetOwner: string) => {
      if (!program || !publicKey) return;

      setOutcome(null);
      let target: PublicKey;
      try {
        target = new PublicKey(targetOwner.trim());
      } catch {
        setFetchError("That isn't a valid wallet address.");
        return;
      }

      const secret = generateSecret();
      // Persist before sending: if the commit lands but the page reloads, the
      // stake is only recoverable with this secret.
      rememberSecret(publicKey, secret);
      const commitment = await commitmentFor(secret, publicKey);

      await run(
        () =>
          program.methods
            .commitRaid(commitment)
            .accountsPartial({
              attacker: publicKey,
              attackerJar: getJarPda(publicKey),
              targetJar: getJarPda(target),
              raid: getRaidPda(publicKey),
            })
            .transaction(),
        async () => {
          await refresh();
          await onJarChanged?.();
        }
      );
    },
    [program, publicKey, run, refresh, onJarChanged]
  );

  const revealRaid = useCallback(async () => {
    if (!program || !publicKey || !raid) return;

    const secret = recallSecret(publicKey);
    if (!secret) {
      setFetchError(
        "The secret for this raid is missing from this browser, so it can't be revealed."
      );
      return;
    }

    await run(
      () =>
        program.methods
          .revealRaid(Array.from(secret))
          .accountsPartial({
            attacker: publicKey,
            attackerJar: getJarPda(publicKey),
            targetJar: raid.target,
            raid: getRaidPda(publicKey),
            slotHashes: new PublicKey(
              "SysvarS1otHashes111111111111111111111111111"
            ),
          })
          .transaction(),
      async (sig) => {
        forgetSecret(publicKey);
        setOutcome(await readOutcome(connection, sig));
        await refresh();
        await onJarChanged?.();
      }
    );
  }, [program, publicKey, raid, run, refresh, connection, onJarChanged]);

  const canReveal =
    raid !== null &&
    currentSlot !== null &&
    currentSlot > raid.commitSlot.toNumber() + 1;

  return {
    raid,
    canReveal,
    outcome,
    status,
    signature,
    error: error ?? fetchError,
    commitRaid,
    revealRaid,
  };
}

/** The program reports the roll in its logs; surface it rather than re-deriving. */
async function readOutcome(
  connection: ReturnType<typeof useConnection>["connection"],
  signature: string
): Promise<string | null> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const detail = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    const line = detail?.meta?.logMessages?.find((log) =>
      log.includes("Raid succeeded") || log.includes("Raid failed")
    );
    if (line) return line.replace(/^Program log: /, "");

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return null;
}
