"use client";

import { useEffect, useState } from "react";
import { getProductsBySlugs, type Product } from "@/lib/products";
import { getRecentlyViewed, recordViewed } from "@/lib/recentlyViewed";
import ProductCard from "./ProductCard";

// "Ostatnio oglądane" - strip na stronie produktu i na home.
// Nic nie renderuje, gdy lista pusta (zero przeskoków layoutu).
export default function RecentlyViewed({
  currentSlug,
  record = false,
  limit = 4,
}: {
  currentSlug?: string;
  record?: boolean;
  limit?: number;
}) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const before = getRecentlyViewed();
    if (record && currentSlug) recordViewed(currentSlug);
    const slugs = before.filter((s) => s !== currentSlug).slice(0, limit);
    if (slugs.length === 0) return;
    let alive = true;
    getProductsBySlugs(slugs).then((list) => {
      if (alive) setProducts(list);
    });
    return () => {
      alive = false;
    };
  }, [currentSlug, record, limit]);

  if (products.length === 0) return null;

  return (
    <section className="container-edge mt-20 md:mt-28">
      <h2 className="mb-7 text-2xl font-semibold">Ostatnio oglądane</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
