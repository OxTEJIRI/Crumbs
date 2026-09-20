"use client";

import { MAX_HEAT, MAX_HP } from "@/lib/solana/nibble";
import type { CookiePhase } from "@/hooks/useNibble";

interface CookieVisualProps {
  hp: number;
  heat: number;
  phase: CookiePhase;
}

const CHIPS = [
  { cx: 38, cy: 42, r: 5.5 },
  { cx: 62, cy: 36, r: 4.5 },
  { cx: 52, cy: 58, r: 6 },
  { cx: 34, cy: 66, r: 4 },
  { cx: 68, cy: 62, r: 5 },
  { cx: 48, cy: 26, r: 3.5 },
];

/** Bites are taken out of the rim as HP falls, one notch per eighth eaten. */
const BITE_POSITIONS = [
  { cx: 50, cy: 6 },
  { cx: 82, cy: 24 },
  { cx: 94, cy: 50 },
  { cx: 82, cy: 76 },
  { cx: 50, cy: 94 },
  { cx: 18, cy: 76 },
  { cx: 6, cy: 50 },
  { cx: 18, cy: 24 },
];

export default function CookieVisual({ hp, heat, phase }: CookieVisualProps) {
  const hpFraction = Math.max(0, Math.min(1, hp / MAX_HP));
  const heatFraction = Math.max(0, Math.min(1, heat / MAX_HEAT));

  const bites = Math.round((1 - hpFraction) * BITE_POSITIONS.length);
  const burned = phase === "burned";
  const eaten = phase === "eaten";

  // Dough darkens toward charcoal as the oven heats.
  const dough = burned
    ? "#3d3126"
    : `color-mix(in oklab, #e0a860 ${100 - Math.round(heatFraction * 70)}%, #6b3a16)`;

  return (
    <div className="relative flex aspect-square w-full max-w-[260px] items-center justify-center">
      <div
        className="absolute inset-0 rounded-full blur-2xl transition-opacity duration-700"
        style={{
          background:
            "radial-gradient(circle, rgba(226,119,90,0.85) 0%, rgba(226,119,90,0) 70%)",
          opacity: burned ? 0.9 : heatFraction * 0.85,
        }}
        aria-hidden
      />

      <svg
        viewBox="0 0 100 100"
        className={`relative w-full transition-transform duration-500 ${
          eaten ? "scale-90 opacity-60" : ""
        }`}
        role="img"
        aria-label={`Cookie at ${Math.round(hpFraction * 100)}% health and ${Math.round(
          heatFraction * 100
        )}% heat`}
      >
        <defs>
          <mask id="bites">
            <rect x="0" y="0" width="100" height="100" fill="white" />
            {BITE_POSITIONS.slice(0, bites).map((bite, i) => (
              <circle key={i} cx={bite.cx} cy={bite.cy} r="13" fill="black" />
            ))}
          </mask>
        </defs>

        <g mask="url(#bites)">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill={dough}
            className="transition-all duration-700"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="2"
          />
          {CHIPS.map((chip, i) => (
            <circle
              key={i}
              cx={chip.cx}
              cy={chip.cy}
              r={chip.r}
              fill={burned ? "#1c1611" : "#4a2a12"}
              className="transition-colors duration-700"
            />
          ))}
        </g>
      </svg>

      {burned && (
        <span className="absolute text-5xl" aria-hidden>
          💨
        </span>
      )}
    </div>
  );
}
