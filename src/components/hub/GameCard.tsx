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
      className={`flex h-full flex-col gap-3 rounded-3xl border border-border bg-surface p-6 shadow-sm transition-all ${
        href
          ? "hover:-translate-y-0.5 hover:shadow-md"
          : "opacity-60 grayscale-[30%]"
      }`}
    >
      {icon ?? <span className="text-4xl">{emoji}</span>}
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="flex-1 text-sm text-muted">{description}</p>
      {!href && (
        <span className="w-fit rounded-full bg-background px-3 py-1 text-xs font-medium text-muted">
          Coming soon
        </span>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
