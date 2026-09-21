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

const COOKIE_CX = 50;
const COOKIE_CY = 55;
const COOKIE_R = 28;

// The knife travels only within the cookie's own vertical span, so a cut
// always visually lands on the cookie rather than above or below it.
const TRACK_TOP = COOKIE_CY - COOKIE_R;
const TRACK_BOTTOM = COOKIE_CY + COOKIE_R;
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
 * and a knife sweeps up and down the cookie until tapped. Whatever is below
 * the tapped line is the piece that "falls" — a bigger cut (tapping higher
 * up) drops a bigger piece, mirroring how an actual knife through a hanging
 * object works. The sweep is driven by directly mutating the knife's
 * transform every frame (not React state), since a state update per frame
 * would mean a re-render per frame — tapping reads the current position
 * from elapsed time instead of from state.
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
  const cutY = displayBps !== null ? trackY(displayBps / BPS_DENOMINATOR) : null;
  const knifeY = cutY ?? TRACK_TOP;

  return (
    <button
      type="button"
      onClick={handleTap}
      disabled={!swinging}
      className="relative flex w-full max-w-[220px] flex-col items-center focus:outline-none disabled:cursor-default"
      aria-label={swinging ? "Tap to cut" : "Cookie"}
    >
      <svg viewBox="0 0 100 110" className="h-56 w-56">
        <defs>
          {/* Only the sliver of the cookie below the cut line — this is the
              piece that visually breaks away and falls once tapped. */}
          <clipPath id="lucky-slice-below-cut">
            <rect x="0" y={cutY ?? 0} width="100" height={110 - (cutY ?? 0)} />
          </clipPath>
        </defs>

        <line x1="50" y1="0" x2="50" y2={TRACK_TOP - COOKIE_R * 0.3} stroke="var(--border)" strokeWidth="2" />

        <circle
          cx={COOKIE_CX}
          cy={COOKIE_CY}
          r={COOKIE_R}
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

        {/* The falling piece: a copy of the cookie, clipped to just the part
            below the cut, that peels off and drops once a tap lands. */}
        {cutY !== null && (
          <g
            clipPath="url(#lucky-slice-below-cut)"
            className="animate-[crumb-fall_650ms_ease-in_forwards]"
          >
            <circle
              cx={COOKIE_CX}
              cy={COOKIE_CY}
              r={COOKIE_R}
              fill="var(--accent)"
              stroke="var(--border)"
              strokeWidth="3"
            />
            {CHIPS.map((chip, i) => (
              <circle key={i} cx={chip.cx} cy={chip.cy} r={chip.r} fill="var(--primary)" opacity="0.7" />
            ))}
          </g>
        )}

        <g
          ref={knifeRef}
          style={{ transform: `translateY(${knifeY}px)` }}
          className={swinging ? "" : "transition-transform duration-300"}
        >
          <polygon points="18,0 26,-3.5 26,3.5" fill="var(--foreground)" />
          <rect x="24" y="-1.5" width="60" height="3" rx="1.5" fill="var(--foreground)" opacity="0.85" />
        </g>
      </svg>

      {swinging && (
        <span className="mt-2 text-sm font-medium text-primary">Tap to cut!</span>
      )}
    </button>
  );
}
