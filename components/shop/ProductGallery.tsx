"use client";

import { useState } from "react";
import ProductMedia from "./ProductMedia";
import ProductVisual from "@/components/ui/ProductVisual";

type Props = {
  image?: string;
  images?: string[];
  name: string;
  motif: string;
  badge?: string;
};

export default function ProductGallery({ image, images, name, motif, badge }: Props) {
  const pics = (images && images.length ? images : image ? [image] : []).slice(0, 6);
  const hasReal = pics.length > 0;
  const [active, setActive] = useState(0);
  const main = pics[active] ?? image;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:gap-4">
      <div className="order-2 flex gap-3 md:order-1 md:w-[88px] md:flex-col">
        {hasReal
          ? pics.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Zdjęcie ${i + 1}`}
                className={`relative aspect-square w-[22%] overflow-hidden rounded-xl border bg-cream md:w-full ${
                  i === active ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink/40"
                }`}
              >
                <ProductMedia image={src} name={name} motif={motif} sizes="88px" />
              </button>
            ))
          : [0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`relative aspect-square w-[22%] overflow-hidden rounded-xl border bg-cream md:w-full ${
                  i === 0 ? "border-ink ring-1 ring-ink" : "border-line"
                }`}
              >
                <ProductVisual className="absolute inset-0 h-full w-full" />
              </div>
            ))}
      </div>

      <div className="relative order-1 aspect-square flex-1 overflow-hidden rounded-2xl border border-line bg-cream md:order-2">
        <ProductMedia image={main} name={name} motif={motif} sizes="(min-width: 1024px) 36rem, 100vw" priority />
        {badge && (
          <span className="absolute left-4 top-4 rounded-md bg-orange px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {badge}
          </span>
        )}
        {!hasReal && (
          <span className="absolute bottom-4 left-4 rounded-full bg-milk/90 px-3 py-1 text-xs text-ash backdrop-blur">
            Zdjęcia wkrótce
          </span>
        )}
      </div>
    </div>
  );
}
