"use client";

import { BPS_DENOMINATOR } from "@/lib/solana/luckySlice";

interface HangingCookieProps {
  /** 0–10000 basis points, or null before the first slice. */
  cutBps: number | null;
  sliced: boolean;
}

const CHIPS = [
  { cx: 42, cy: 46, r: 3.5 },
  { cx: 60, cy: 40, r: 3 },
  { cx: 50, cy: 58, r: 4 },
  { cx: 38, cy: 62, r: 2.5 },
  { cx: 64, cy: 58, r: 3 },
];

/**
 * A cookie hangs from a string (standing in for the carrot in the reference
 * gameplay). The cut line's height tracks the last roll — bigger cut, higher
 * line — with a knife icon riding along it as flavor for the "cut" moment.
 */
export default function HangingCookie({ cutBps, sliced }: HangingCookieProps) {
  const fraction = cutBps === null ? 0 : cutBps / BPS_DENOMINATOR;
  // Cookie body spans roughly y=28..78; the line travels within that range.
  const lineY = 78 - fraction * 50;

  return (
    <svg viewBox="0 0 100 110" className="h-40 w-40" role="img" aria-label="A cookie hanging from a string">
      <line x1="50" y1="0" x2="50" y2="20" stroke="var(--border)" strokeWidth="2" />

      <g
        className="origin-top transition-transform duration-500"
        style={{ transform: sliced ? "translateY(4px) rotate(2deg)" : "none" }}
      >
        <circle
          cx="50"
          cy="53"
          r="25"
          fill="var(--accent)"
          stroke="var(--border)"
          strokeWidth="3"
        />
        {CHIPS.map((chip, i) => (
          <circle key={i} cx={chip.cx} cy={chip.cy} r={chip.r} fill="var(--primary)" opacity="0.7" />
        ))}
      </g>

      {cutBps !== null && (
        <g className="transition-all duration-500">
          <line
            x1="22"
            y1={lineY}
            x2="78"
            y2={lineY}
            stroke="var(--danger)"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <text
            x="50"
            y={lineY - 6}
            textAnchor="middle"
            className="fill-foreground font-mono text-[9px] font-semibold"
          >
            {(fraction * 100).toFixed(1)}%
          </text>
        </g>
      )}
    </svg>
  );
}
