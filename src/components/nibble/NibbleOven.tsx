"use client";

import { useMemo, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNibble } from "@/hooks/useNibble";
import {
  BAKER_LOCK_SLOTS,
  BPS_DENOMINATOR,
  damageBps,
  glazeCostLamports,
  GLAZE_HEAT_REDUCTION,
  GLAZE_HP_RESTORE,
  heatDelta,
  IDLE_HEAT,
  IDLE_SLOTS,
  JAR_SHARE_BPS,
  MAX_HEAT,
  MAX_HP,
  MIN_BAKE_LAMPORTS,
  MIN_NIBBLE_LAMPORTS,
  payoutLamports,
} from "@/lib/solana/nibble";
import CookieVisual from "./CookieVisual";
import OvenActivity from "./OvenActivity";

const cook = (lamports: number) => lamports / LAMPORTS_PER_SOL;

function formatCook(lamports: number, digits = 4) {
  return `${cook(lamports).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} COOK`;
}

function Bar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "hp" | "heat";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-mono tabular-nums">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background:
              tone === "hp"
                ? "var(--color-success)"
                : `color-mix(in oklab, var(--color-accent) ${100 - pct}%, var(--color-danger))`,
          }}
        />
      </div>
    </div>
  );
}

function AmountInput({
  value,
  onChange,
  presets,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  presets: number[];
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.001"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full bg-transparent font-mono text-sm outline-none disabled:opacity-50"
        />
        <span className="text-sm text-muted">COOK</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={disabled}
            onClick={() => onChange(String(cook(preset)))}
            className="rounded-full border border-border px-3 py-1 font-mono text-xs text-muted transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
          >
            {cook(preset)}
          </button>
        ))}
      </div>
    </div>
  );
}

const primaryButton =
  "h-12 w-full rounded-full bg-primary px-5 font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";
const secondaryButton =
  "h-11 w-full rounded-full border border-border px-5 text-sm font-medium transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50";

export default function NibbleOven() {
  const { publicKey } = useWallet();
  const { state, slot, loaded, error, status, bake, nibble, glaze, pull, crankHeat } =
    useNibble();

  const [bakeAmount, setBakeAmount] = useState(String(cook(MIN_BAKE_LAMPORTS)));
  const [bidAmount, setBidAmount] = useState(String(cook(MIN_NIBBLE_LAMPORTS * 50)));

  const busy = status === "pending" || status === "confirming";

  const live = state?.phase === "live";
  const isBaker =
    !!publicKey && !!state?.baker && state.baker.equals(publicKey);

  const idleSlots = state ? Math.max(0, slot - state.lastActionSlot) : 0;
  const idleTicks = Math.floor(idleSlots / IDLE_SLOTS);
  const overdue = live && idleTicks > 0;
  const lockedSlotsLeft = state
    ? Math.max(0, BAKER_LOCK_SLOTS - (slot - state.createdSlot))
    : 0;

  const bidLamports = Math.floor((Number(bidAmount) || 0) * LAMPORTS_PER_SOL);
  const bakeLamports = Math.floor((Number(bakeAmount) || 0) * LAMPORTS_PER_SOL);

  const bite = useMemo(() => {
    if (!state || !live || bidLamports <= 0) return null;

    const damage = damageBps(bidLamports, state.hp);
    const potAfterBid = state.pot + bidLamports;
    const payout = payoutLamports(potAfterBid, damage, state.hp);
    const kills = damage >= state.hp;
    const potAfterPayout = potAfterBid - payout;
    const jarCut = Math.floor((potAfterPayout * JAR_SHARE_BPS) / BPS_DENOMINATOR);

    return {
      damage,
      payout,
      kills,
      net: payout - bidLamports,
      winnings: kills ? potAfterPayout - jarCut : 0,
      newHeat: Math.min(MAX_HEAT, state.heat + heatDelta(damage)),
    };
  }, [state, live, bidLamports]);

  const nibbleBlockedReason = (() => {
    if (!live) return "There's no cookie in the oven.";
    if (bidLamports < MIN_NIBBLE_LAMPORTS)
      return `Minimum bite is ${formatCook(MIN_NIBBLE_LAMPORTS)}.`;
    if (isBaker && lockedSlotsLeft > 0)
      return `You just baked this. ${lockedSlotsLeft} more slot${
        lockedSlotsLeft === 1 ? "" : "s"
      } before you can bite it.`;
    return null;
  })();

  if (!loaded) {
    return <p className="py-20 text-center text-muted">Reading the oven…</p>;
  }

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-6 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-muted">Pot</span>
            <span className="font-display text-4xl font-semibold tabular-nums">
              {formatCook(state?.pot ?? 0)}
            </span>
            {state && (
              <span className="text-xs text-muted">
                Batch #{state.batchId} · {state.nibbleCount} bite
                {state.nibbleCount === 1 ? "" : "s"} taken
                {isBaker && live ? " · you baked this one" : ""}
              </span>
            )}
          </div>

          <div className="flex justify-center">
            <CookieVisual
              hp={state?.hp ?? 0}
              heat={state?.heat ?? 0}
              phase={state?.phase ?? "empty"}
            />
          </div>

          {state && live ? (
            <div className="flex flex-col gap-3">
              <Bar label="Cookie left" value={state.hp} max={MAX_HP} tone="hp" />
              <Bar label="Oven heat" value={state.heat} max={MAX_HEAT} tone="heat" />
            </div>
          ) : (
            <p className="text-center text-muted">
              {state?.phase === "eaten"
                ? "That batch got eaten. Bake a new cookie to restart the oven."
                : state?.phase === "burned"
                  ? "That batch burned to a crisp and the pot went to the jar. Bake a fresh one."
                  : state?.phase === "pulled"
                    ? "The baker pulled that one out in time. The oven is free."
                    : "The oven is empty. Bake the first cookie."}
            </p>
          )}

          {overdue && (
            <p className="rounded-xl bg-danger-surface p-3 text-center text-sm">
              Nobody has touched this in {idleSlots} slots. It&apos;s taken{" "}
              {idleTicks} heat tick{idleTicks === 1 ? "" : "s"} and will keep
              cooking until someone acts.
            </p>
          )}

          {error && <p className="text-center text-sm text-danger">{error}</p>}
        </div>

        {live ? (
          <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-lg font-semibold">Take a bite</h2>
            <AmountInput
              value={bidAmount}
              onChange={setBidAmount}
              presets={[
                MIN_NIBBLE_LAMPORTS * 10,
                MIN_NIBBLE_LAMPORTS * 50,
                MIN_NIBBLE_LAMPORTS * 200,
              ]}
              disabled={busy}
            />

            {bite && (
              <div className="flex flex-col gap-1.5 rounded-xl bg-background p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Damage</span>
                  <span className="font-mono tabular-nums">
                    {(bite.damage / 100).toFixed(2)}% of the cookie
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Crumbs back right away</span>
                  <span className="font-mono tabular-nums">
                    {formatCook(bite.payout)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5">
                  <span className="text-muted">Net cost of this bite</span>
                  <span className="font-mono tabular-nums text-danger">
                    {formatCook(Math.abs(bite.net))}
                  </span>
                </div>
                {bite.kills ? (
                  <p className="mt-1 rounded-lg bg-surface p-2 text-center text-xs">
                    This bite finishes it. You&apos;d also take the remaining
                    pot of{" "}
                    <span className="font-mono">{formatCook(bite.winnings)}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted">
                    Every bite costs more than it pays back. You&apos;re paying
                    for the chance to land the last bite and take what&apos;s
                    left in the pot.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => nibble(bidLamports)}
              disabled={busy || !!nibbleBlockedReason}
              className={primaryButton}
            >
              {busy ? "Biting…" : `Bite for ${formatCook(bidLamports)}`}
            </button>
            {nibbleBlockedReason && (
              <p className="text-center text-xs text-muted">
                {nibbleBlockedReason}
              </p>
            )}

            {isBaker && (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <p className="text-sm text-muted">
                  You baked this cookie. You can cool it down, or pull it out
                  and take the pot.
                </p>
                <button
                  onClick={glaze}
                  disabled={busy}
                  className={secondaryButton}
                >
                  {busy
                    ? "Working…"
                    : `Glaze for ${formatCook(glazeCostLamports(state.heat))}: −${
                        GLAZE_HEAT_REDUCTION / 100
                      }% heat, +${GLAZE_HP_RESTORE / 100}% cookie`}
                </button>
                <button
                  onClick={pull}
                  disabled={busy}
                  className={secondaryButton}
                >
                  {busy
                    ? "Working…"
                    : `Pull it out: take ${formatCook(
                        state.pot -
                          Math.floor((state.pot * JAR_SHARE_BPS) / BPS_DENOMINATOR)
                      )}`}
                </button>
              </div>
            )}

            {overdue && (
              <button
                onClick={crankHeat}
                disabled={busy}
                className={secondaryButton}
              >
                {busy
                  ? "Working…"
                  : `Stoke the oven: add ${(
                      (IDLE_HEAT * idleTicks) /
                      100
                    ).toFixed(0)}% heat`}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-lg font-semibold">
              Bake a cookie
            </h2>
            <p className="text-sm text-muted">
              Whatever you put in starts the pot. Everyone else pays to bite it,
              and every bite grows the pot. Pull it out in time and you take
              what&apos;s left. Let it burn and the jar takes everything.
            </p>
            <AmountInput
              value={bakeAmount}
              onChange={setBakeAmount}
              presets={[
                MIN_BAKE_LAMPORTS,
                MIN_BAKE_LAMPORTS * 2,
                MIN_BAKE_LAMPORTS * 10,
              ]}
              disabled={busy}
            />
            <button
              onClick={() => bake(bakeLamports)}
              disabled={busy || bakeLamports < MIN_BAKE_LAMPORTS}
              className={primaryButton}
            >
              {busy ? "Baking…" : `Bake for ${formatCook(bakeLamports)}`}
            </button>
            {bakeLamports < MIN_BAKE_LAMPORTS && (
              <p className="text-center text-xs text-muted">
                Minimum bake is {formatCook(MIN_BAKE_LAMPORTS)}.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="w-full lg:w-[340px] lg:shrink-0">
        <OvenActivity batchId={state?.batchId ?? 0} />
      </div>
    </div>
  );
}
