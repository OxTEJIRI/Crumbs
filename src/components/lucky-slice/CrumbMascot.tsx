export type MascotMood = "idle" | "happy" | "neutral" | "sad";

interface CrumbMascotProps {
  mood: MascotMood;
  className?: string;
}

/**
 * A small crumb-themed mascot, standing in for the placeholder character from
 * the reference gameplay — an original design in the same SVG style as
 * JarIcon/CookieVisual rather than a specific borrowed character, and easy to
 * reskin later per the request that this is a first pass.
 */
export default function CrumbMascot({ mood, className }: CrumbMascotProps) {
  const mouth = {
    idle: "M42 66 Q50 70 58 66",
    happy: "M40 62 Q50 76 60 62",
    neutral: "M42 66 L58 66",
    sad: "M40 70 Q50 58 60 70",
  }[mood];

  const eyeTilt = mood === "sad" ? 4 : 0;
  const cheeks = mood === "happy";

  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={`Mascot feeling ${mood}`}>
      {/* Body: an irregular crumb silhouette rather than a plain circle */}
      <path
        d="M50 14 C66 12 82 24 84 40 C88 54 78 62 80 72 C82 84 66 90 50 88 C34 90 18 84 20 72 C22 62 12 54 16 40 C18 24 34 12 50 14 Z"
        fill="var(--accent)"
        stroke="var(--border)"
        strokeWidth="3"
      />
      <circle cx="34" cy="36" r="3" fill="var(--primary)" opacity="0.6" />
      <circle cx="66" cy="42" r="2.5" fill="var(--primary)" opacity="0.6" />
      <circle cx="60" cy="24" r="2" fill="var(--primary)" opacity="0.5" />

      {cheeks && (
        <>
          <ellipse cx="30" cy="58" rx="6" ry="4" fill="var(--primary)" opacity="0.35" />
          <ellipse cx="70" cy="58" rx="6" ry="4" fill="var(--primary)" opacity="0.35" />
        </>
      )}

      <g transform={`rotate(${eyeTilt} 50 50)`}>
        <circle cx="40" cy="48" r="4" fill="var(--foreground)" />
        <circle cx="60" cy="48" r="4" fill="var(--foreground)" />
      </g>

      <path
        d={mouth}
        fill="none"
        stroke="var(--foreground)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
