import Link from "next/link";
import type { Product } from "@/lib/products";
import ProductCard from "@/components/shop/ProductCard";
import Reveal from "@/components/ui/Reveal";

type Props = {
  title: string;
  subtitle?: string;
  products: Product[];
  href?: string;
  hrefLabel?: string;
};

export default function ProductRow({ title, subtitle, products, href = "/sklep", hrefLabel = "Zobacz wszystko" }: Props) {
  if (products.length === 0) return null;

  return (
    <section className="container-edge pt-16 md:pt-24">
      <Reveal className="mb-7 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-ash">{subtitle}</p>}
        </div>
        <Link
          href={href}
          className="shrink-0 text-sm font-medium text-coral transition-colors hover:text-coral-deep"
        >
          {hrefLabel} →
        </Link>
      </Reveal>

      <Reveal delay={70}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}
