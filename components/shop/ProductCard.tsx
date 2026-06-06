import Link from "next/link";
import type { Product } from "@/lib/products";
import { categoryName } from "@/lib/products";
import { formatPrice, productRating, FREE_SHIPPING_FROM } from "@/lib/format";
import ProductMedia from "./ProductMedia";
import { AddToCartCompact } from "./AddToCart";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ash">
      <span className="text-coral" aria-hidden="true">
        {"★".repeat(Math.round(rating))}
        <span className="text-line">{"★".repeat(5 - Math.round(rating))}</span>
      </span>
    </span>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const item = {
    slug: product.slug,
    name: product.name,
    price: product.price,
    motif: product.visual.motif,
    tone: product.visual.tone,
    image: product.images?.[0],
  };
  const { rating, reviews } = productRating(product.slug);
  const freeShipping = product.price >= FREE_SHIPPING_FROM;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow duration-300 hover:shadow-[0_10px_34px_-16px_rgba(20,20,20,0.22)]">
      <Link
        href={`/sklep/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-cream"
      >
        <ProductMedia
          image={item.image}
          name={product.name}
          motif={item.motif}
          sizes="(min-width: 1024px) 22rem, 50vw"
          className="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        {product.badges && product.badges.length > 0 && (
          <span className="absolute left-3 top-3 rounded-md bg-orange px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
            {product.badges[0]}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-xs text-ash">{categoryName(product.category)}</p>
        <Link
          href={`/sklep/${product.slug}`}
          className="line-clamp-2 min-h-[2.6rem] text-sm font-medium leading-snug transition-colors hover:text-coral"
        >
          {product.name}
        </Link>

        <div className="mt-2 flex items-center gap-1.5">
          <Stars rating={rating} />
          <span className="text-xs text-mist">({reviews})</span>
        </div>

        <div className="mt-auto pt-3">
          <p className="text-xl font-semibold tabular-nums">{formatPrice(product.price)}</p>
          <p className={`mt-0.5 text-xs ${freeShipping ? "text-emerald-600" : "text-ash"}`}>
            {freeShipping ? "Darmowa dostawa" : "Wysyłka 24h"}
          </p>
          <AddToCartCompact item={item} />
        </div>
      </div>
    </article>
  );
}
