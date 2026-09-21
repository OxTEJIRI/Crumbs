/**
 * Static jar glyph used anywhere 🫙 would otherwise appear (hub card, sub
 * header, hero). The jar emoji is Unicode 14.0 and doesn't render on Windows
 * 10 or pre-22H2 Windows 11 — no font ships the glyph, so it shows as blank
 * space instead of tofu. An inline SVG has no such dependency.
 */
export default function JarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Cookie jar">
      <rect x="34" y="14" width="52" height="12" rx="4" fill="var(--primary)" />
      <rect x="40" y="10" width="40" height="8" rx="3" fill="var(--accent)" />
      <path
        d="M28 34 L26 100 Q26 108 34 108 L86 108 Q94 108 94 100 L92 34 Z"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="3"
      />
      <circle cx="48" cy="58" r="4" fill="var(--primary)" />
      <circle cx="70" cy="50" r="3.5" fill="var(--primary)" />
      <circle cx="58" cy="78" r="4" fill="var(--primary)" />
      <circle cx="76" cy="82" r="3" fill="var(--primary)" />
    </svg>
  );
}
