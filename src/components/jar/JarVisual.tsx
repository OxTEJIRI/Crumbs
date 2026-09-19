"use client";

/**
 * Purely cosmetic fill level. Crumb totals are unbounded, so this uses an
 * asymptotic curve (half full around 200 crumbs) rather than a linear scale
 * that would either start invisibly empty or cap out and stop reacting.
 */
function fillPercent(total: number): number {
  return Math.min(100, (100 * total) / (total + 200));
}

export default function JarVisual({ crumbs }: { crumbs: number }) {
  const fill = fillPercent(crumbs);

  return (
    <svg
      viewBox="0 0 120 120"
      className="h-28 w-28 shrink-0"
      role="img"
      aria-label={`Jar ${Math.round(fill)}% full`}
    >
      <defs>
        <clipPath id="jarClip">
          <path d="M28 34 L26 100 Q26 108 34 108 L86 108 Q94 108 94 100 L92 34 Z" />
        </clipPath>
      </defs>

      {/* Lid */}
      <rect x="34" y="14" width="52" height="12" rx="4" fill="var(--primary)" />
      <rect x="40" y="10" width="40" height="8" rx="3" fill="var(--accent)" />

      {/* Jar body outline */}
      <path
        d="M28 34 L26 100 Q26 108 34 108 L86 108 Q94 108 94 100 L92 34 Z"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="3"
      />

      {/* Crumb fill, clipped to the jar's silhouette */}
      <g clipPath="url(#jarClip)">
        <rect
          x="20"
          y={108 - fill * 0.74}
          width="80"
          height={fill * 0.74 + 10}
          fill="var(--accent)"
          className="transition-all duration-700 ease-out"
        />
        {fill > 8 && (
          <>
            <circle cx="45" cy={108 - fill * 0.74 + 10} r="3" fill="var(--primary)" />
            <circle cx="65" cy={108 - fill * 0.74 + 18} r="2.5" fill="var(--primary)" />
            <circle cx="55" cy={108 - fill * 0.74 + 28} r="3" fill="var(--primary)" />
          </>
        )}
      </g>

      <path
        d="M28 34 L26 100 Q26 108 34 108 L86 108 Q94 108 94 100 L92 34 Z"
        fill="none"
        stroke="var(--border)"
        strokeWidth="3"
      />
    </svg>
  );
}
