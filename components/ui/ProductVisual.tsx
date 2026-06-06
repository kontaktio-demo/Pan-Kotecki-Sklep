import { MOTIFS } from "./motifs";

type Props = {
  motif: string;
  tone?: string;
  className?: string;
  grain?: boolean;
};

export default function ProductVisual({ motif, className = "" }: Props) {
  const draw = MOTIFS[motif] ?? MOTIFS.ball;

  return (
    <div
      className={`relative isolate flex items-center justify-center overflow-hidden bg-cream ${className}`}
      aria-hidden="true"
    >
      <svg
        className="h-3/5 w-3/5"
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
      >
        <g transform="translate(0,-4)">{draw({ stroke: "#a6a6a0", accent: "#c4c4bd" })}</g>
      </svg>
      <span className="absolute bottom-2.5 right-3 text-[0.58rem] font-medium uppercase tracking-[0.18em] text-mist">
        Pan Kotecki
      </span>
    </div>
  );
}
