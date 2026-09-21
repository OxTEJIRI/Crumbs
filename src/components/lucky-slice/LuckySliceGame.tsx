"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLuckySlice } from "@/hooks/useLuckySlice";
import CrumbMascot, { type MascotMood } from "./CrumbMascot";
import HangingCookie from "./HangingCookie";
import LuckySliceLeaderboard from "./LuckySliceLeaderboard";

const moodFor = (cutBps: number | null): MascotMood => {
  if (cutBps === null) return "idle";
  if (cutBps >= 6_600) return "happy";
  if (cutBps >= 3_300) return "neutral";
  return "sad";
};

export default function LuckySliceGame() {
  const { publicKey } = useWallet();
  const { state, lastRoll, status, error, slice } = useLuckySlice();

  const [justSliced, setJustSliced] = useState(false);
  const busy = status === "pending" || status === "confirming";

  useEffect(() => {
    if (!justSliced) return;
    const id = setTimeout(() => setJustSliced(false), 600);
    return () => clearTimeout(id);
  }, [justSliced, lastRoll]);

  const handleSlice = async () => {
    setJustSliced(false);
    const ok = await slice();
    if (ok) setJustSliced(true);
  };

  if (!publicKey) {
    return (
      <p className="text-center text-muted">
        Connect your wallet to try your luck.
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex-1">
        <div className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-8">
            <CrumbMascot mood={moodFor(lastRoll)} className="h-28 w-28" />
            <HangingCookie cutBps={lastRoll} sliced={justSliced} />
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-sm text-muted">
              {lastRoll === null ? "Take your first slice" : "Your last cut"}
            </span>
            <span className="font-display text-3xl font-semibold tabular-nums">
              {lastRoll === null ? "—" : `${(lastRoll / 100).toFixed(2)}%`}
            </span>
          </div>

          <button
            onClick={handleSlice}
            disabled={busy}
            className="h-12 w-full max-w-xs rounded-full bg-primary px-5 font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {busy ? "Slicing…" : "Slice"}
          </button>

          {state && (
            <div className="flex w-full items-center justify-around rounded-2xl bg-background px-4 py-3 text-sm">
              <div className="flex flex-col items-center">
                <span className="text-muted">Best cut</span>
                <span className="font-mono font-semibold tabular-nums">
                  {(state.bestCutBps / 100).toFixed(2)}%
                </span>
              </div>
              <div className="h-8 w-px bg-border" aria-hidden />
              <div className="flex flex-col items-center">
                <span className="text-muted">Attempts</span>
                <span className="font-mono font-semibold tabular-nums">
                  {state.attempts.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {error && <p className="text-center text-sm text-danger">{error}</p>}
        </div>
      </div>

      <div className="w-full lg:w-[340px] lg:shrink-0">
        <LuckySliceLeaderboard />
      </div>
    </div>
  );
}
