import Paw from "./Paw";

type Props = {
  motif?: string;
  tone?: string;
  className?: string;
  grain?: boolean;
};

export default function ProductVisual({ className = "" }: Props) {
  return (
    <div
      className={`relative isolate flex items-center justify-center overflow-hidden bg-gradient-to-br from-cream to-peach ${className}`}
      aria-hidden="true"
    >
      <Paw className="h-[32%] w-[32%] text-ink/15" />
      <span className="absolute bottom-2.5 right-3 text-[0.58rem] font-medium uppercase tracking-[0.18em] text-mist">
        Pan Kotecki
      </span>
    </div>
  );
}
