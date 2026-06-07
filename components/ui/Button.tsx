import Link from "next/link";

type Variant = "solid" | "outline" | "ghost";

type CommonProps = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  arrow?: boolean;
};

const base =
  "tap group inline-flex items-center justify-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-medium";

const styles: Record<Variant, string> = {
  solid: "bg-ink text-milk hover:bg-coral",
  outline: "border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-milk",
  ghost: "text-ink hover:text-coral",
};

function Inner({ children, arrow }: { children: React.ReactNode; arrow?: boolean }) {
  return (
    <>
      <span>{children}</span>
      {arrow && <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>}
    </>
  );
}

export function Button({
  children,
  variant = "solid",
  className = "",
  arrow = false,
  href,
  ...rest
}: CommonProps &
  ({ href: string } | { href?: undefined }) &
  React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = `${base} ${styles[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        <Inner arrow={arrow}>{children}</Inner>
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      <Inner arrow={arrow}>{children}</Inner>
    </button>
  );
}
