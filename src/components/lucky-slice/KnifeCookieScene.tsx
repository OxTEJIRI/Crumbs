"use client";

import { useEffect, useRef, useState } from "react";
import { knifePositionFraction, fractionToBps } from "@/lib/luckySlice/knife";
import { BPS_DENOMINATOR } from "@/lib/solana/luckySlice";

interface KnifeCookieSceneProps {
  /** null before a round starts, or after a cut's been submitted. */
  targetBps: number | null;
  /** The knife only swings while a round is open and unresolved. */
  swinging: boolean;
  /** Set once submitted, to freeze the knife at the tapped position. */
  frozenAtBps: number | null;
  onCut: (actualBps: number) => void;
}

// Cookie body spans this range along the track; the knife and target marker
// both map their 0..1 fraction onto it.
const TRACK_TOP = 18;
const TRACK_BOTTOM = 92;
const trackY = (fraction: number) => TRACK_TOP + fraction * (TRACK_BOTTOM - TRACK_TOP);

const CHIPS = [
  { cx: 42, cy: 50, r: 3.5 },
  { cx: 60, cy: 44, r: 3 },
  { cx: 50, cy: 62, r: 4 },
  { cx: 38, cy: 66, r: 2.5 },
  { cx: 64, cy: 62, r: 3 },
];

/**
 * The whole game: a cookie hangs on a track, a target line marks the goal,
 * and a knife sweeps up and down the track until tapped. The sweep is driven
 * by directly mutating the knife's transform every frame (not React state),
 * since a state update per frame would mean a re-render per frame — tapping
 * reads the current position from elapsed time instead of from state.
 */
export default function KnifeCookieScene({
  targetBps,
  swinging,
  frozenAtBps,
  onCut,
}: KnifeCookieSceneProps) {
  const knifeRef = useRef<SVGGElement>(null);
  const startedAtRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  // The instant a tap happens, its position needs to freeze immediately —
  // waiting for `frozenAtBps` (which only updates once the transaction
  // confirms) would leave the knife showing last round's result, or jump
  // to the top, for however long confirmation takes. The parent remounts
  // this component (via `key`) at the start of every round, so this always
  // starts back at null rather than needing to be reset on `swinging`.
  const [tappedAtBps, setTappedAtBps] = useState<number | null>(null);

  useEffect(() => {
    if (!swinging) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      return;
    }

    startedAtRef.current = performance.now();
    const tick = () => {
      const elapsed = performance.now() - startedAtRef.current;
      const y = trackY(knifePositionFraction(elapsed));
      if (knifeRef.current) {
        knifeRef.current.style.transform = `translateY(${y}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [swinging]);

  const handleTap = () => {
    if (!swinging) return;
    const elapsed = performance.now() - startedAtRef.current;
    const bps = fractionToBps(knifePositionFraction(elapsed));
    setTappedAtBps(bps);
    onCut(bps);
  };

  const displayBps = tappedAtBps ?? frozenAtBps;
  const knifeY = displayBps !== null ? trackY(displayBps / BPS_DENOMINATOR) : TRACK_TOP;

  return (
    <button
      type="button"
      onClick={handleTap}
      disabled={!swinging}
      className="relative flex w-full max-w-[220px] flex-col items-center focus:outline-none disabled:cursor-default"
      aria-label={swinging ? "Tap to cut" : "Cookie"}
    >
      <svg viewBox="0 0 100 110" className="h-56 w-56">
        <line x1="50" y1="0" x2="50" y2="16" stroke="var(--border)" strokeWidth="2" />

        <circle
          cx="50"
          cy="55"
          r="28"
          fill="var(--accent)"
          stroke="var(--border)"
          strokeWidth="3"
        />
        {CHIPS.map((chip, i) => (
          <circle key={i} cx={chip.cx} cy={chip.cy} r={chip.r} fill="var(--primary)" opacity="0.7" />
        ))}

        {targetBps !== null && (
          <g>
            <line
              x1="14"
              y1={trackY(targetBps / BPS_DENOMINATOR)}
              x2="86"
              y2={trackY(targetBps / BPS_DENOMINATOR)}
              stroke="var(--success)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <text
              x="90"
              y={trackY(targetBps / BPS_DENOMINATOR) + 3}
              className="fill-success font-mono text-[7px] font-semibold"
            >
              {(targetBps / 100).toFixed(0)}%
            </text>
          </g>
        )}

        <g
          ref={knifeRef}
          style={{ transform: `translateY(${knifeY}px)` }}
          className={swinging ? "" : "transition-transform duration-300"}
        >
          <polygon points="10,0 40,-3 40,3" fill="var(--foreground)" />
          <rect x="38" y="-1.5" width="52" height="3" rx="1.5" fill="var(--foreground)" opacity="0.7" />
        </g>
      </svg>

      {swinging && (
        <span className="mt-2 text-sm font-medium text-primary">Tap to cut!</span>
      )}
    </button>
  );
}
