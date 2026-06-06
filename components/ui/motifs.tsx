import type { ReactNode } from "react";

type MotifColors = { stroke: string; accent: string };

const S = (c: MotifColors) => ({
  fill: "none",
  stroke: c.stroke,
  strokeWidth: 3.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const MOTIFS: Record<string, (c: MotifColors) => ReactNode> = {
  mouse: (c) => (
    <g>
      <ellipse cx="92" cy="120" rx="42" ry="26" {...S(c)} />
      <circle cx="118" cy="98" r="13" {...S(c)} />
      <path d="M52 124 C34 138 30 110 22 104" {...S(c)} />
      <line x1="138" y1="120" x2="168" y2="112" {...S(c)} />
      <line x1="138" y1="126" x2="170" y2="126" {...S(c)} />
      <line x1="136" y1="132" x2="166" y2="140" {...S(c)} />
      <circle cx="120" cy="118" r="4.5" fill={c.accent} />
    </g>
  ),
  wand: (c) => (
    <g>
      <line x1="48" y1="158" x2="120" y2="74" {...S(c)} />
      <line x1="44" y1="162" x2="58" y2="148" {...S(c)} strokeWidth={6} />
      <path d="M120 74 L150 50 M120 74 L152 70 M120 74 L138 44" {...S(c)} />
      <path d="M120 74 L150 50" stroke={c.accent} strokeWidth={3.4} strokeLinecap="round" />
      <circle cx="120" cy="74" r="4.5" fill={c.accent} />
    </g>
  ),
  ball: (c) => (
    <g>
      <circle cx="100" cy="112" r="42" {...S(c)} />
      <path d="M58 112 H142 M100 70 V154 M70 82 Q100 112 130 142 M130 82 Q100 112 70 142" {...S(c)} strokeWidth={2.4} />
      <circle cx="100" cy="112" r="7" fill={c.accent} />
    </g>
  ),
  tunnel: (c) => (
    <g>
      <path d="M40 150 V104 A60 60 0 0 1 160 104 V150" {...S(c)} />
      <ellipse cx="100" cy="150" rx="60" ry="16" {...S(c)} />
      <path d="M66 150 V116 M134 150 V116 M100 150 V96" {...S(c)} strokeWidth={2.4} />
      <circle cx="100" cy="138" r="9" fill={c.accent} />
    </g>
  ),
  kicker: (c) => (
    <g>
      <rect x="62" y="58" width="40" height="104" rx="20" transform="rotate(18 82 110)" {...S(c)} />
      <path d="M118 70 q18 -10 22 6 q-16 6 -22 -6 Z" fill={c.accent} stroke="none" />
      <line x1="118" y1="72" x2="106" y2="86" {...S(c)} strokeWidth={2.4} />
    </g>
  ),
  bed: (c) => (
    <g>
      <path d="M40 116 q60 -34 120 0 l-8 36 q-52 22 -104 0 Z" {...S(c)} />
      <ellipse cx="100" cy="120" rx="46" ry="14" {...S(c)} strokeWidth={2.4} />
      <path d="M78 122 q22 -16 44 0" stroke={c.accent} strokeWidth={3.4} fill="none" strokeLinecap="round" />
    </g>
  ),
  bowl: (c) => (
    <g>
      <path d="M52 110 q48 30 96 0 l-10 30 q-38 18 -76 0 Z" {...S(c)} />
      <ellipse cx="100" cy="110" rx="48" ry="14" {...S(c)} />
      <path d="M92 104 a6 6 0 1 0 0.1 0 M104 100 a5 5 0 1 0 0.1 0 M86 96 a4 4 0 1 0 0.1 0 M98 92 a4 4 0 1 0 0.1 0" fill={c.accent} stroke="none" />
    </g>
  ),
  fountain: (c) => (
    <g>
      <path d="M58 150 q42 18 84 0 l-6 -24 q-36 14 -72 0 Z" {...S(c)} />
      <ellipse cx="100" cy="120" rx="32" ry="9" {...S(c)} strokeWidth={2.4} />
      <path d="M100 116 q-22 -28 4 -50 q26 22 4 50" stroke={c.accent} strokeWidth={3.4} fill="none" strokeLinecap="round" />
      <circle cx="104" cy="60" r="4" fill={c.accent} />
    </g>
  ),
  scratcher: (c) => (
    <g>
      <path d="M70 158 H130 M86 158 V70 H114 V158" {...S(c)} />
      <path d="M92 84 h16 M90 96 h20 M90 108 h20 M90 120 h20 M90 132 h20 M90 144 h20" stroke={c.stroke} strokeWidth={2} strokeLinecap="round" />
      <ellipse cx="100" cy="66" rx="26" ry="8" {...S(c)} />
      <circle cx="128" cy="92" r="6" fill={c.accent} />
      <line x1="122" y1="70" x2="128" y2="86" {...S(c)} strokeWidth={2} />
    </g>
  ),
  collar: (c) => (
    <g>
      <path d="M58 96 a44 30 0 1 0 84 0" {...S(c)} />
      <rect x="92" y="84" width="16" height="14" rx="3" {...S(c)} strokeWidth={2.4} />
      <circle cx="100" cy="142" r="13" {...S(c)} />
      <circle cx="100" cy="142" r="4.5" fill={c.accent} />
    </g>
  ),
  carrier: (c) => (
    <g>
      <rect x="48" y="92" width="104" height="68" rx="16" {...S(c)} />
      <path d="M78 92 q22 -30 44 0" {...S(c)} />
      <path d="M112 108 v36 M126 108 v36 M98 126 h44" stroke={c.stroke} strokeWidth={2} strokeLinecap="round" />
      <rect x="58" y="118" width="28" height="18" rx="4" fill={c.accent} stroke="none" />
    </g>
  ),
  brush: (c) => (
    <g>
      <rect x="60" y="64" width="80" height="34" rx="14" {...S(c)} />
      <path d="M70 98 v22 M82 98 v26 M94 98 v22 M106 98 v26 M118 98 v22 M130 98 v26" stroke={c.stroke} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M140 81 q24 0 24 28" stroke={c.accent} strokeWidth={3.4} fill="none" strokeLinecap="round" />
    </g>
  ),
  mug: (c) => (
    <g>
      <path d="M62 78 h60 v54 a24 24 0 0 1 -24 24 h-12 a24 24 0 0 1 -24 -24 Z" {...S(c)} />
      <path d="M122 92 q26 4 22 28 q-4 18 -22 16" {...S(c)} />
      <path d="M84 64 q-6 -12 4 -20 M100 64 q-6 -12 4 -20" stroke={c.stroke} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <path d="M82 112 l6 8 l6 -8 M88 120 q4 8 0 14" stroke={c.accent} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  thermo: (c) => (
    <g>
      <path d="M78 64 h44 l-6 92 a16 16 0 0 1 -32 0 Z" {...S(c)} />
      <rect x="74" y="52" width="52" height="16" rx="6" {...S(c)} strokeWidth={2.6} />
      <path d="M80 104 h38" stroke={c.accent} strokeWidth={4} strokeLinecap="round" />
    </g>
  ),
  mugpair: (c) => (
    <g>
      <path d="M52 92 h40 v36 a18 18 0 0 1 -18 18 h-4 a18 18 0 0 1 -18 -18 Z" {...S(c)} />
      <path d="M92 100 q18 2 16 18 q-2 12 -16 12" {...S(c)} strokeWidth={2.6} />
      <path d="M108 100 h40 v36 a18 18 0 0 1 -18 18 h-4 a18 18 0 0 1 -18 -18 Z" {...S(c)} />
      <path d="M148 108 q18 2 16 18 q-2 12 -16 12" {...S(c)} strokeWidth={2.6} />
      <circle cx="72" cy="110" r="4.5" fill={c.accent} />
    </g>
  ),
  tote: (c) => (
    <g>
      <path d="M58 86 h84 l8 78 h-100 Z" {...S(c)} />
      <path d="M80 86 q6 -30 20 -30 q14 0 20 30" {...S(c)} strokeWidth={2.6} />
      <path d="M88 124 l6 6 M112 124 l-6 6 M94 138 q6 6 12 0" stroke={c.accent} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M86 112 l4 -8 l4 8 M106 112 l4 -8 l4 8" stroke={c.stroke} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  socks: (c) => (
    <g>
      <path d="M74 58 v44 l-18 22 a14 14 0 0 0 20 18 l24 -26 v-58 Z" {...S(c)} />
      <path d="M110 58 v44 l18 22 a14 14 0 0 1 -20 18 l-24 -26" {...S(c)} strokeWidth={2.6} />
      <circle cx="72" cy="132" r="4" fill={c.accent} />
      <circle cx="120" cy="132" r="4" fill={c.accent} />
    </g>
  ),
  pin: (c) => (
    <g>
      <path d="M64 96 l4 -34 l22 18 a40 40 0 0 1 20 0 l22 -18 l4 34 a44 40 0 0 1 -98 0 Z" fill={c.accent} stroke="none" />
      <circle cx="84" cy="100" r="4" fill={c.stroke} />
      <circle cx="116" cy="100" r="4" fill={c.stroke} />
      <path d="M94 112 q6 6 12 0" stroke={c.stroke} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      <line x1="100" y1="138" x2="100" y2="160" {...S(c)} strokeWidth={2.4} />
    </g>
  ),
  notebook: (c) => (
    <g>
      <rect x="62" y="56" width="76" height="100" rx="8" {...S(c)} />
      <line x1="120" y1="56" x2="120" y2="156" {...S(c)} strokeWidth={2.4} />
      <path d="M132 56 v40 l-8 -8 l-8 8 V56" fill={c.accent} stroke="none" />
      <path d="M78 86 h28 M78 104 h28 M78 122 h20" stroke={c.stroke} strokeWidth={2} strokeLinecap="round" />
    </g>
  ),
  hoodie: (c) => (
    <g>
      <path d="M70 84 q30 -28 60 0 l24 16 l-14 22 l-10 -6 v44 h-60 v-44 l-10 6 l-14 -22 Z" {...S(c)} />
      <path d="M82 80 q18 22 36 0" {...S(c)} strokeWidth={2.6} />
      <line x1="92" y1="92" x2="92" y2="118" {...S(c)} strokeWidth={2.4} />
      <line x1="108" y1="92" x2="108" y2="118" {...S(c)} strokeWidth={2.4} />
      <path d="M86 128 h28" stroke={c.accent} strokeWidth={3.4} strokeLinecap="round" />
    </g>
  ),
};

export const MOTIF_KEYS = Object.keys(MOTIFS);
