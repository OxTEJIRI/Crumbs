"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BN } from "@anchor-lang/core";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  getOvenPda,
  glazeCostLamports,
  IDLE_HEAT,
  JAR_ADDRESS,
  MAX_HEAT,
} from "@/lib/solana/nibble";
import { useNibbleProgram } from "@/lib/solana/useNibbleProgram";
import { describeError, useTransactionStatus } from "./useTransactionStatus";

export type CookiePhase = "empty" | "live" | "eaten" | "burned" | "pulled";

export interface OvenState {
  phase: CookiePhase;
  baker: PublicKey | null;
  batchId: number;
  hp: number;
  heat: number;
  createdSlot: number;
  lastActionSlot: number;
  nibbleCount: number;
  lastNibbler: PublicKey | null;
  /** Lamports in play, i.e. the account balance above its rent reserve. */
  pot: number;
}

/** Other people bake, bite and glaze between your own turns, so the oven is polled rather than only refreshed after your transactions. */
const POLL_MS = 4000;

export function useNibble() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useNibbleProgram();
  const { status, run } = useTransactionStatus();

  // Memoised because it feeds `read`'s dependencies: a fresh PublicKey each
  // render would re-arm the polling effect on every render, and that effect
  // sets state, which would spin it into a continuous loop of RPC calls.
  const oven = useMemo(() => getOvenPda(), []);
  const rentRef = useRef<number | null>(null);

  const [state, setState] = useState<OvenState | null>(null);
  const [slot, setSlot] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const read = useCallback(async (): Promise<{
    state: OvenState | null;
    slot: number;
  }> => {
    const [account, info, currentSlot] = await Promise.all([
      program.account.cookie.fetchNullable(oven),
      connection.getAccountInfo(oven),
      connection.getSlot(),
    ]);

    if (!account || !info) {
      return { state: null, slot: currentSlot };
    }

    if (rentRef.current === null) {
      rentRef.current = await connection.getMinimumBalanceForRentExemption(
        info.data.length
      );
    }

    const phase = (Object.keys(account.state)[0] ?? "empty") as CookiePhase;

    return {
      slot: currentSlot,
      state: {
        phase,
        baker: account.baker,
        batchId: account.batchId.toNumber(),
        hp: account.hp,
        heat: account.heat,
        createdSlot: account.createdSlot.toNumber(),
        lastActionSlot: account.lastActionSlot.toNumber(),
        nibbleCount: account.nibbleCount,
        lastNibbler: account.lastNibbler,
        pot: Math.max(0, info.lamports - rentRef.current),
      },
    };
  }, [program, connection, oven]);

  const refresh = useCallback(async () => {
    try {
      const next = await read();
      setState(next.state);
      setSlot(next.slot);
      setError(null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoaded(true);
    }
  }, [read]);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const next = await read();
        if (cancelled) return;
        setState(next.state);
        setSlot(next.slot);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(describeError(err));
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [read]);

  const bake = useCallback(
    async (lamports: number) => {
      if (!publicKey) return false;
      return run(
        "Baking a new cookie",
        () =>
          program.methods
            .bake(new BN(lamports))
            .accountsPartial({ baker: publicKey })
            .transaction(),
        refresh
      );
    },
    [program, publicKey, run, refresh]
  );

  const nibble = useCallback(
    async (lamports: number) => {
      if (!publicKey) return false;
      return run(
        "Taking a bite",
        () =>
          program.methods
            .nibble(new BN(lamports))
            .accountsPartial({ nibbler: publicKey, jar: JAR_ADDRESS })
            .transaction(),
        refresh
      );
    },
    [program, publicKey, run, refresh]
  );

  const glaze = useCallback(async () => {
    if (!publicKey || !state) return false;

    // Heat only ever rises before this lands, so the ceiling allows for one
    // idle window's worth arriving first — otherwise a tick between preview
    // and confirmation would fail the whole transaction.
    const ceiling = glazeCostLamports(Math.min(MAX_HEAT, state.heat + IDLE_HEAT));

    return run(
      "Glazing the cookie",
      () =>
        program.methods
          .glaze(new BN(ceiling))
          .accountsPartial({ baker: publicKey, jar: JAR_ADDRESS })
          .transaction(),
      refresh
    );
  }, [program, publicKey, state, run, refresh]);

  const pull = useCallback(async () => {
    if (!publicKey) return false;
    return run(
      "Pulling the cookie out",
      () =>
        program.methods
          .pull()
          .accountsPartial({ baker: publicKey, jar: JAR_ADDRESS })
          .transaction(),
      refresh
    );
  }, [program, publicKey, run, refresh]);

  const crankHeat = useCallback(async () => {
    if (!publicKey) return false;
    return run(
      "Stoking the oven",
      () =>
        program.methods
          .crankHeat()
          .accountsPartial({ cranker: publicKey, jar: JAR_ADDRESS })
          .transaction(),
      refresh
    );
  }, [program, publicKey, run, refresh]);

  return {
    state,
    slot,
    loaded,
    error,
    status,
    refresh,
    bake,
    nibble,
    glaze,
    pull,
    crankHeat,
  };
}
