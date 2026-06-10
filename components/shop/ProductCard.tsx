"use client";

import Link from "next/link";
import type { Product } from "@/lib/products";
import { categoryName } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { useSettings } from "@/components/providers/SettingsProvider";
import ProductMedia from "./ProductMedia";
import WishlistButton from "./WishlistButton";
import { AddToCartCompact } from "./AddToCart";

export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  const full = Math.round(rating);
  return (
    <span className={`inline-flex items-center gap-1 text-xs text-ash ${className}`}>
      <span className="text-coral" aria-hidden="true">
        {"★".repeat(full)}
        <span className="text-line">{"★".repeat(5 - full)}</span>
      </span>
      <span className="sr-only">Ocena {rating.toFixed(1)} na 5</span>
    </span>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const { freeShippingZl } = useSettings();
  const item = {
    slug: product.slug,
    name: product.name,
    price: product.price,
    motif: product.visual?.motif ?? "",
    tone: product.visual?.tone ?? "",
    image: product.images?.[0],
    inStock: product.inStock,
  };
  const freeShipping = product.price >= freeShippingZl;
  const ratingCount = product.ratingCount ?? 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all duration-300 hover:-translate-y-1 hover:border-line hover:shadow-[0_22px_44px_-26px_rgba(20,14,6,0.4)]">
      <Link
        href={`/sklep/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-cream"
      >
        <ProductMedia
          image={item.image}
          name={product.name}
          motif={item.motif}
          sizes="(min-width: 1024px) 22rem, 50vw"
          className="transition-transform duration-[600ms] ease-out group-hover:scale-[1.05]"
        />
        <WishlistButton slug={product.slug} name={product.name} />
        {product.badges && product.badges.length > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-orange px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-wide text-white shadow-sm">
            {product.badges[0]}
          </span>
        )}
        {product.originalPrice && (
          <span className="absolute left-3 bottom-3 rounded-full bg-coral px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-wide text-white shadow-sm">
            Promocja
          </span>
        )}
        {!product.inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/75 py-1.5 text-center text-xs font-medium text-milk backdrop-blur-sm">
            Chwilowo niedostępny
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-[0.7rem] uppercase tracking-wide text-mist">{categoryName(product.category)}</p>
        <Link
          href={`/sklep/${product.slug}`}
          className="line-clamp-2 min-h-[2.6rem] text-sm font-medium leading-snug transition-colors hover:text-coral"
        >
          {product.name}
        </Link>

        {ratingCount > 0 && product.ratingAvg != null && (
          <div className="mt-2 flex items-center gap-1.5">
            <Stars rating={product.ratingAvg} />
            <span className="text-xs text-mist">({ratingCount})</span>
          </div>
        )}
        {product.inStock && product.lowStock != null && (
          <p className="mt-2 text-xs font-medium text-orange-deep">
            {product.lowStock === 1 ? "Ostatnia sztuka!" : `Zostały ${product.lowStock} szt.`}
          </p>
        )}

        <div className="mt-auto pt-3">
          <p className="flex items-baseline gap-2">
            <span className="text-xl font-semibold tabular-nums">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-ash line-through tabular-nums">{formatPrice(product.originalPrice)}</span>
            )}
          </p>
          <p className={`mt-0.5 inline-flex items-center gap-1 text-xs ${freeShipping ? "text-teal" : "text-ash"}`}>
            {freeShipping && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12 5 5L20 7" />
              </svg>
            )}
            {freeShipping ? "Darmowa dostawa" : "Wysyłka 24h"}
          </p>
          <AddToCartCompact item={item} />
        </div>
      </div>
    </article>
  );
}
