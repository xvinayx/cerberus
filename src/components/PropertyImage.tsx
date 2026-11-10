import type { PropertyType } from "@/lib/types";

/**
 * Illustrated placeholder shown when a listing has no photo (or it fails to
 * load). Deterministic per property id + variant so it never flickers.
 */

const SKIES = [
  ["#bfe3f5", "#eaf6fb"], // midday
  ["#f9c99b", "#fde8d2"], // golden hour
  ["#9dc3e6", "#dbe9f5"], // overcast
  ["#2b3a63", "#6b6f9e"], // dusk
];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const FACADES = ["#5b7083", "#7a6a5c", "#4f6b62", "#6c6f86", "#8a7b6a", "#596779"];

function Windows({
  x, y, cols, rows, w, h, gapX, gapY, lit, seed,
}: {
  x: number; y: number; cols: number; rows: number; w: number; h: number;
  gapX: number; gapY: number; lit: boolean; seed: number;
}) {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const on = lit && ((seed >> ((r * cols + c) % 24)) & 1) === 1;
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={x + c * (w + gapX)}
          y={y + r * (h + gapY)}
          width={w}
          height={h}
          fill={on ? "#fde68a" : "#c9dbe6"}
          opacity={on ? 0.95 : 0.75}
        />,
      );
    }
  }
  return <>{cells}</>;
}

function Building({ type, facade, lit, seed }: { type: PropertyType; facade: string; lit: boolean; seed: number }) {
  switch (type) {
    case "Office":
      return (
        <g>
          <rect x="70" y="95" width="70" height="120" fill={facade} opacity="0.7" />
          <rect x="150" y="40" width="110" height="175" fill={facade} />
          <Windows x={160} y={52} cols={6} rows={11} w={11} h={9} gapX={5} gapY={5} lit={lit} seed={seed} />
          <rect x="270" y="80" width="70" height="135" fill={facade} opacity="0.8" />
          <Windows x={278} y={92} cols={3} rows={8} w={13} h={9} gapX={7} gapY={6} lit={lit} seed={seed >> 3} />
        </g>
      );
    case "Retail":
      return (
        <g>
          <rect x="50" y="140" width="300" height="75" fill={facade} />
          <rect x="50" y="128" width="300" height="14" fill="#2f3e4d" />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <path d={`M${58 + i * 58} 150 h50 l-6 14 h-38 z`} fill={i % 2 ? "#1689ad" : "#e8eef2"} />
              <rect x={62 + i * 58} y="168" width="42" height="40" fill={lit ? "#fde68a" : "#c9dbe6"} opacity="0.85" />
            </g>
          ))}
          <rect x="300" y="70" width="14" height="70" fill="#2f3e4d" />
          <rect x="285" y="60" width="44" height="22" rx="3" fill="#1689ad" />
        </g>
      );
    case "Industrial":
      return (
        <g>
          <path d="M40 215 V120 l52 -24 v24 l52 -24 v24 l52 -24 v24 l52 -24 v24 l52 -24 V215 z" fill={facade} />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={60 + i * 58} y="160" width="38" height="55" fill="#d7dde2" stroke="#8796a3" strokeWidth="2" />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={`w${i}`} x={64 + i * 58} y="128" width="30" height="8" fill={lit ? "#fde68a" : "#c9dbe6"} />
          ))}
        </g>
      );
    case "Multifamily":
      return (
        <g>
          <rect x="70" y="70" width="260" height="145" fill={facade} />
          <rect x="62" y="62" width="276" height="10" fill="#2f3e4d" />
          <Windows x={84} y={84} cols={8} rows={6} w={18} h={14} gapX={12} gapY={8} lit={lit} seed={seed} />
          {[0, 1, 2, 3, 4, 5].map((r) => (
            <rect key={r} x="80" y={100 + r * 22} width="240" height="2" fill="#2f3e4d" opacity="0.5" />
          ))}
        </g>
      );
    case "Hospitality":
      return (
        <g>
          <rect x="125" y="45" width="150" height="170" fill={facade} />
          <rect x="150" y="28" width="100" height="22" rx="3" fill="#2f3e4d" />
          <rect x="170" y="34" width="60" height="10" rx="2" fill="#fde68a" />
          <Windows x={137} y={62} cols={7} rows={9} w={12} h={10} gapX={6} gapY={6} lit={lit} seed={seed} />
          <path d="M150 215 v-20 h100 v20" fill="#2f3e4d" />
          <rect x="60" y="170" width="65" height="45" fill={facade} opacity="0.75" />
          <rect x="275" y="170" width="65" height="45" fill={facade} opacity="0.75" />
        </g>
      );
    case "Healthcare":
    case "Life Science":
    case "Educational":
    case "Religious":
    case "Other":
      return (
        <g>
          <rect x="80" y="60" width="240" height="155" fill={facade} />
          <Windows x={96} y={74} cols={9} rows={5} w={14} h={12} gapX={10} gapY={10} lit={lit} seed={seed} />
          <rect x="80" y="170" width="240" height="45" fill="#2f3e4d" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={92 + i * 58} y="178" width="46" height="37" fill={lit ? "#fde68a" : "#c9dbe6"} opacity="0.9" />
          ))}
          <rect x="70" y="164" width="260" height="8" fill="#1689ad" />
        </g>
      );
    case "Land":
      return (
        <g>
          <path d="M0 200 Q100 160 200 185 T400 175 V260 H0 z" fill="#8fbf7f" />
          <path d="M0 220 Q120 195 240 212 T400 205 V260 H0 z" fill="#6fa565" />
          {[60, 140, 300, 345].map((x, i) => (
            <g key={x}>
              <rect x={x - 2} y={176 + (i % 2) * 8} width="4" height="16" fill="#5c4632" />
              <circle cx={x} cy={170 + (i % 2) * 8} r="12" fill="#4d8a4a" />
            </g>
          ))}
          <rect x="190" y="150" width="4" height="50" fill="#5c4632" />
          <rect x="160" y="132" width="64" height="26" rx="2" fill="#ffffff" stroke="#2f3e4d" strokeWidth="2" />
          <rect x="168" y="140" width="48" height="4" fill="#1689ad" />
          <rect x="168" y="148" width="32" height="3" fill="#94a3b8" />
        </g>
      );
  }
}

export default function PropertyImage({
  id,
  type,
  variant = 0,
  className = "",
}: {
  id: string;
  type: PropertyType;
  variant?: number;
  className?: string;
}) {
  const seed = hash(`${id}:${variant}`);
  // Each gallery variant gets a different time of day.
  const sky = SKIES[(hash(id) + variant) % SKIES.length];
  const facade = FACADES[hash(id) % FACADES.length];
  const lit = sky === SKIES[3] || sky === SKIES[1];
  const gradientId = `sky-${id}-${variant}`;

  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={`Illustration of a ${type.toLowerCase()} property`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill={`url(#${gradientId})`} />
      {sky === SKIES[1] && <circle cx="330" cy="70" r="26" fill="#fbbf77" opacity="0.8" />}
      <path d="M0 215 L60 150 L120 190 L190 140 L260 185 L330 150 L400 195 V260 H0 z" fill="#000" opacity="0.06" />
      {type !== "Land" && <rect x="0" y="213" width="400" height="47" fill="#9aa5ad" />}
      {type !== "Land" && <rect x="0" y="213" width="400" height="4" fill="#7b8790" />}
      <Building type={type} facade={facade} lit={lit} seed={seed} />
    </svg>
  );
}
