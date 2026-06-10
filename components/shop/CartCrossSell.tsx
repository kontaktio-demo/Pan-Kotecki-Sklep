"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { getProducts, type Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { toast } from "@/lib/toast";
import ProductMedia from "./ProductMedia";

// "Koty kupują też" - dyskretny cross-sell na stronie koszyka: bestsellery
// z kategorii produktów w koszyku, bez tych, które już tam są.
export default function CartCrossSell() {
  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const [picks, setPicks] = useState<Product[]>([]);

  useEffect(() => {
    if (items.length === 0) {
      setPicks([]);
      return;
    }
    let alive = true;
    getProducts().then((all) => {
      if (!alive) return;
      const inCart = new Set(items.map((i) => i.slug));
      const cartCategories = new Set(
        all.filter((p) => inCart.has(p.slug)).map((p) => p.category),
      );
      const candidates = all.filter(
        (p) => !inCart.has(p.slug) && p.inStock && (cartCategories.has(p.category) || p.bestseller),
      );
      candidates.sort((a, b) => Number(b.bestseller ?? false) - Number(a.bestseller ?? false));
      setPicks(candidates.slice(0, 3));
    });
    return () => {
      alive = false;
    };
  }, [items]);

  if (picks.length === 0) return null;

  return (
    <section className="mt-4">
      <h2 className="mb-4 text-xl font-semibold">Koty kupują też</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {picks.map((p) => (
          <div key={p.slug} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
            <Link href={`/sklep/${p.slug}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-cream">
              <ProductMedia image={p.images?.[0]} name={p.name} motif={p.visual?.motif ?? ""} sizes="4rem" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/sklep/${p.slug}`} className="line-clamp-2 text-sm font-medium leading-snug transition-colors hover:text-coral">
                {p.name}
              </Link>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatPrice(p.price)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                add(
                  {
                    slug: p.slug,
                    name: p.name,
                    price: p.price,
                    motif: p.visual?.motif ?? "",
                    tone: p.visual?.tone ?? "",
                    image: p.images?.[0],
                  },
                  1,
                );
                toast("Dodano do koszyka");
              }}
              aria-label={`Dodaj ${p.name} do koszyka`}
              className="tap inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-milk transition-colors hover:bg-coral"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
