import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProducts, getProductBySlug, getRelated, categoryName } from "@/lib/products";
import { formatPrice, productRating, FREE_SHIPPING_FROM } from "@/lib/format";
import ProductGallery from "@/components/shop/ProductGallery";
import ProductReviews from "@/components/shop/ProductReviews";
import ProductCard from "@/components/shop/ProductCard";
import { AddToCartFull } from "@/components/shop/AddToCart";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Nie znaleziono produktu" };
  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: { title: product.name, description: product.shortDescription },
  };
}

const BENEFITS = [
  {
    t: "Wysyłka w 24h",
    icon: <path d="M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    t: "Darmowa dostawa od 149 zł",
    icon: <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 18a2 2 0 1 0 .1 0M18 18a2 2 0 1 0 .1 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    t: "14 dni na zwrot",
    icon: <path d="M4 8h11a5 5 0 0 1 0 10H9M4 8l4-4M4 8l4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    t: "Bezpieczne płatności",
    icon: <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3ZM9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelated(slug, 4);
  const { rating, reviews } = productRating(product.slug);
  const freeShipping = product.price >= FREE_SHIPPING_FROM;
  const item = {
    slug: product.slug,
    name: product.name,
    price: product.price,
    motif: product.visual?.motif ?? "",
    tone: product.visual?.tone ?? "",
    image: product.images?.[0],
    inStock: product.inStock,
  };

  return (
    <div className="pt-5 md:pt-7">
      <div className="container-edge">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-ash">
          <Link href="/" className="transition-colors hover:text-ink">Strona główna</Link>
          <span>/</span>
          <Link href="/sklep" className="transition-colors hover:text-ink">Sklep</Link>
          <span>/</span>
          <Link href={`/sklep?kategoria=${product.category}`} className="transition-colors hover:text-ink">
            {categoryName(product.category)}
          </Link>
          <span>/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ProductGallery
            image={item.image}
            images={product.images}
            name={product.name}
            motif={item.motif}
            badge={product.badges?.[0]}
          />

          <div className="lg:py-2">
            <p className="text-sm text-ash">{categoryName(product.category)}</p>
            <h1 className="mt-1 text-3xl font-semibold leading-tight md:text-4xl">{product.name}</h1>

            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="tracking-wide text-coral" aria-hidden="true">★★★★★</span>
              <span className="text-ash">{rating.toFixed(1)} · {reviews} opinii</span>
            </div>

            <div className="mt-5 flex items-end gap-3">
              <p className="text-3xl font-semibold tabular-nums">{formatPrice(product.price)}</p>
              {product.originalPrice && (
                <span className="mb-1 text-lg text-ash line-through tabular-nums">{formatPrice(product.originalPrice)}</span>
              )}
              <span className={`mb-1 text-sm ${freeShipping ? "text-emerald-600" : "text-ash"}`}>
                {freeShipping ? "+ darmowa dostawa" : `darmowa dostawa od ${FREE_SHIPPING_FROM} zł`}
              </span>
            </div>

            <p className="mt-5 text-lg leading-relaxed text-ink-soft">{product.shortDescription}</p>

            <div className="mt-7">
              <AddToCartFull item={item} />
            </div>

            <p className="mt-4 flex items-center gap-2 text-sm text-ash">
              <span className={`h-2 w-2 rounded-full ${product.inStock ? "bg-emerald-500" : "bg-mist"}`} />
              {product.inStock ? "Dostępny — wysyłamy w 24h" : "Chwilowo niedostępny"}
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 rounded-2xl bg-cream p-4 sm:grid-cols-4">
              {BENEFITS.map((b) => (
                <div key={b.t} className="flex flex-col items-center gap-2 px-1 text-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange/12 text-orange-deep">
                    <svg width="20" height="20" viewBox="0 0 24 24">{b.icon}</svg>
                  </span>
                  <span className="text-xs leading-tight text-ink-soft">{b.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:mt-20 md:grid-cols-2 md:gap-10">
          <div>
            <h2 className="mb-3 text-xl font-semibold">O produkcie</h2>
            <p className="leading-relaxed text-ink-soft">{product.description}</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-6">
            <h2 className="mb-3 text-xl font-semibold">Szczegóły</h2>
            <dl className="divide-y divide-line">
              {product.details.map((d) => (
                <div key={d} className="py-2.5 text-sm text-ink-soft">{d}</div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <ProductReviews />

      {related.length > 0 && (
        <section className="container-edge mt-20 md:mt-28">
          <h2 className="mb-7 text-2xl font-semibold">Z tej samej półki</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
