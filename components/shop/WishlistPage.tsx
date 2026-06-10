"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWishlist } from "@/store/wishlist";
import { getProductsBySlugs, type Product } from "@/lib/products";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import ProductCard from "./ProductCard";
import Paw from "@/components/ui/Paw";

export default function WishlistPage() {
  const slugs = useWishlist((s) => s.slugs);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (slugs.length === 0) {
      setProducts([]);
      return;
    }
    let alive = true;
    getProductsBySlugs(slugs).then((list) => {
      if (alive) setProducts(list);
    });
    return () => {
      alive = false;
    };
  }, [mounted, slugs]);

  return (
    <div className="container-edge pt-6 md:pt-8">
      <nav className="flex items-center gap-2 text-sm text-ash">
        <Link href="/" className="transition-colors hover:text-ink">Strona główna</Link>
        <span>/</span>
        <span className="text-ink">Ulubione</span>
      </nav>

      <h1 className="mt-4 text-3xl font-semibold md:text-4xl">Ulubione</h1>
      <p className="mt-2 text-ink-soft">
        Produkty odłożone na później - dla Ciebie albo dla kota (ale wiemy, że dla kota).
      </p>

      <div className="mb-20 mt-8">
        {!mounted || products === null ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-cream/40 px-6 py-16 text-center">
            <Paw className="h-9 w-9 text-mist" />
            <p className="mt-4 text-lg font-medium">Tu jeszcze nic nie ma</p>
            <p className="mt-1 max-w-sm text-sm text-ash">
              Klikaj serduszko przy produktach, a zbiorą się tutaj. Kot na pewno coś sobie upatrzy.
            </p>
            <Link
              href="/sklep"
              className="tap mt-6 rounded-xl bg-coral px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-coral/20 hover:bg-coral-deep"
            >
              Przejdź do sklepu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {products.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
