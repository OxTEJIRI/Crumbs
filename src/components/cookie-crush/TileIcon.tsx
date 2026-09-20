import { TILE_TYPES } from "@/lib/cookieCrush/board";

/** Cookie-themed vector icons, one per tile type — no external image assets. */
function Cookie() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <circle cx="20" cy="20" r="17" fill="#d9a066" />
      <circle cx="20" cy="20" r="17" fill="none" stroke="#b9803f" strokeWidth="1.5" />
      <circle cx="13" cy="14" r="2.2" fill="#6b4226" />
      <circle cx="24" cy="12" r="2" fill="#6b4226" />
      <circle cx="27" cy="21" r="2.3" fill="#6b4226" />
      <circle cx="16" cy="24" r="2" fill="#6b4226" />
      <circle cx="22" cy="27" r="1.8" fill="#6b4226" />
    </svg>
  );
}

function Cupcake() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <path d="M10 20 L30 20 L27 34 L13 34 Z" fill="#e8a33d" />
      <path d="M10 20 L30 20 L28.5 25 L11.5 25 Z" fill="#c9791f" opacity="0.6" />
      <path
        d="M11 21 Q10 11 20 12 Q30 11 29 21 Q20 15 11 21 Z"
        fill="#f4c9de"
      />
      <circle cx="20" cy="9" r="2.2" fill="#e35d6a" />
    </svg>
  );
}

function Donut() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <circle cx="20" cy="20" r="16" fill="#e8b992" />
      <circle cx="20" cy="20" r="16" fill="none" stroke="#c99268" strokeWidth="1.5" />
      <path
        d="M20 4 A16 16 0 0 1 34.9 15 A16 15.9 0 0 1 20 4 Z"
        fill="#e35d6a"
        opacity="0.85"
      />
      <circle cx="20" cy="20" r="6" fill="var(--background)" />
      <circle cx="16" cy="10" r="1.3" fill="#fff" />
      <circle cx="24" cy="9" r="1.1" fill="#e8a33d" />
      <circle cx="29" cy="14" r="1.2" fill="#fff" />
    </svg>
  );
}

function ChocolateBar() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <rect x="6" y="6" width="28" height="28" rx="4" fill="#6b4226" />
      <g stroke="#513019" strokeWidth="1.4">
        <line x1="20" y1="6" x2="20" y2="34" />
        <line x1="6" y1="20" x2="34" y2="20" />
      </g>
      <rect x="7.5" y="7.5" width="11" height="11" rx="1.5" fill="#7a4d2d" />
      <rect x="21.5" y="21.5" width="11" height="11" rx="1.5" fill="#7a4d2d" />
    </svg>
  );
}

function Candy() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <ellipse cx="20" cy="20" rx="10" ry="8" fill="#c14e33" />
      <path d="M10 15 L2 10 L4 20 L2 30 L10 25 Z" fill="#c14e33" />
      <path d="M30 15 L38 10 L36 20 L38 30 L30 25 Z" fill="#c14e33" />
      <ellipse cx="17" cy="17" rx="2.5" ry="1.6" fill="#f4b6a6" opacity="0.8" />
    </svg>
  );
}

function Lollipop() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <circle cx="20" cy="18" r="14" fill="#e8a33d" />
      <path
        d="M20 18 m0 -12 a12 12 0 0 1 12 12 a8 8 0 0 1 -8 -8 a4 4 0 0 0 -4 4"
        fill="none"
        stroke="#c9791f"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <rect x="18.5" y="30" width="3" height="8" rx="1.5" fill="#e9dcc4" />
    </svg>
  );
}

const ICONS = [Cookie, Cupcake, Donut, ChocolateBar, Candy, Lollipop];

if (ICONS.length !== TILE_TYPES) {
  throw new Error("TileIcon must define exactly TILE_TYPES icons");
}

export default function TileIcon({ type }: { type: number }) {
  const Icon = ICONS[type];
  return <Icon />;
}
