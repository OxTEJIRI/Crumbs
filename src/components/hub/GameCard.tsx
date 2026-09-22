import type { ReactNode } from "react";
import Link from "next/link";

interface GameCardProps {
  /** Plain-text emoji icon. Prefer `icon` for anything not universally
   * supported by older Windows font releases (see JarIcon's note). */
  emoji?: string;
  /** A rendered icon (e.g. an inline SVG) used instead of `emoji`. */
  icon?: ReactNode;
  title: string;
  description: string;
  href?: string;
}

export default function GameCard({
  emoji,
  icon,
  title,
  description,
  href,
}: GameCardProps) {
  const content = (
    <div
      className={`group relative flex h-full flex-col gap-3 overflow-hidden rounded-3xl border border-primary/20 bg-surface p-6 shadow-md transition-all ${
        href
          ? "hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
          : "opacity-60 grayscale-[30%]"
      }`}
    >
      {/* A soft glow anchored behind the icon, the same device the
          reference uses to give each tile its own presence against the
          dark canvas — kept to the brand's own amber rather than a
          different hue per card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-primary/15 blur-2xl transition-opacity group-hover:opacity-80"
      />
      <div className="relative">{icon ?? <span className="text-4xl">{emoji}</span>}</div>
      <h3 className="relative font-display text-xl font-semibold tracking-tight">
        {title}
      </h3>
      <p className="relative flex-1 text-sm text-muted">{description}</p>
      {!href && (
        <span className="relative w-fit rounded-full bg-background px-3 py-1 text-xs font-medium text-muted">
          Coming soon
        </span>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
