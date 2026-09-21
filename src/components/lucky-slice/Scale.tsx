interface ScaleProps {
  /** Size of the piece that fell — everything below the cut, not the raw tap position. */
  pieceBps: number;
}

/** The severed piece's weigh-in, shown once a cut has landed. */
export default function Scale({ pieceBps }: ScaleProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 100 60" className="h-14 w-24" role="img" aria-label="Scale">
        <rect x="30" y="30" width="40" height="8" rx="2" fill="var(--primary)" />
        <rect x="46" y="38" width="8" height="14" fill="var(--border)" />
        <rect x="20" y="52" width="60" height="6" rx="3" fill="var(--border)" />
        <rect
          x="38"
          y="16"
          width="24"
          height="16"
          rx="4"
          fill="var(--surface)"
          stroke="var(--border)"
          strokeWidth="2"
        />
        <text
          x="50"
          y="27"
          textAnchor="middle"
          className="fill-foreground font-mono text-[8px] font-semibold"
        >
          {(pieceBps / 100).toFixed(1)}%
        </text>
      </svg>
    </div>
  );
}
