import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProducts, getProductBySlug, getRelated, categoryName } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { getPublicSettings } from "@/lib/settings";
import WishlistButton from "@/components/shop/WishlistButton";
import RecentlyViewed from "@/components/shop/RecentlyViewed";
import ProductGallery from "@/components/shop/ProductGallery";
import ProductReviews from "@/components/shop/ProductReviews";
import ProductCard from "@/components/shop/ProductCard";
import { AddToCartFull } from "@/components/shop/AddToCart";
import JsonLd from "@/components/seo/JsonLd";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pankotecki.pl";

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
  if (!product) return { title: "Nie znaleziono produktu", robots: { index: false } };
  const path = `/sklep/${product.slug}`;
  const img = product.images?.[0];
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: path },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      url: path,
      ...(img ? { images: [{ url: img }] } : {}),
    },
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

  const [related, settings] = await Promise.all([getRelated(slug, 4), getPublicSettings()]);
  const ratingCount = product.ratingCount ?? 0;
  const ratingAvg = product.ratingAvg ?? null;
  const freeShipping = product.price >= settings.freeShippingZl;
  const item = {
    slug: product.slug,
    name: product.name,
    price: product.price,
    motif: product.visual?.motif ?? "",
    tone: product.visual?.tone ?? "",
    image: product.images?.[0],
    inStock: product.inStock,
  };

  // Dane strukturalne. aggregateRating TYLKO przy prawdziwych opiniach
  // (fałszywe oceny w schema.org = ryzyko kary Google).
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.shortDescription,
    ...(product.images?.length ? { image: product.images } : {}),
    ...(product.category ? { category: categoryName(product.category) } : {}),
    brand: { "@type": "Brand", name: "Pan Kotecki" },
    ...(ratingCount > 0 && ratingAvg != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingAvg.toFixed(1),
            reviewCount: ratingCount,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: `${SITE}/sklep/${product.slug}`,
      priceCurrency: "PLN",
      price: product.price.toFixed(2),
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Pan Kotecki" },
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Strona główna", item: SITE },
      { "@type": "ListItem", position: 2, name: "Sklep", item: `${SITE}/sklep` },
      { "@type": "ListItem", position: 3, name: categoryName(product.category), item: `${SITE}/sklep?kategoria=${product.category}` },
      { "@type": "ListItem", position: 4, name: product.name, item: `${SITE}/sklep/${product.slug}` },
    ],
  };

  return (
    <div className="pt-5 md:pt-7">
      <JsonLd data={[productLd, breadcrumbLd]} />
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

            {ratingCount > 0 && ratingAvg != null && (
              <a href="#opinie" className="mt-3 flex items-center gap-2 text-sm transition-colors hover:text-ink">
                <span className="tracking-wide text-coral" aria-hidden="true">
                  {"★".repeat(Math.round(ratingAvg))}
                  <span className="text-line">{"★".repeat(5 - Math.round(ratingAvg))}</span>
                </span>
                <span className="text-ash">
                  {ratingAvg.toFixed(1)} - {ratingCount} {ratingCount === 1 ? "opinia" : ratingCount < 5 ? "opinie" : "opinii"}
                </span>
              </a>
            )}

            <div className="mt-5 flex items-end gap-3">
              <p className="text-3xl font-semibold tabular-nums">{formatPrice(product.price)}</p>
              {product.originalPrice && (
                <span className="mb-1 text-lg text-ash line-through tabular-nums">{formatPrice(product.originalPrice)}</span>
              )}
              <span className={`mb-1 text-sm font-medium ${freeShipping ? "text-teal" : "text-ash"}`}>
                {freeShipping ? "+ darmowa dostawa" : `darmowa dostawa od ${settings.freeShippingZl} zł`}
              </span>
            </div>

            <p className="mt-5 text-lg leading-relaxed text-ink-soft">{product.shortDescription}</p>

            <div className="mt-7 flex items-start gap-3">
              <div className="flex-1">
                <AddToCartFull item={item} />
              </div>
              <WishlistButton slug={product.slug} name={product.name} variant="button" />
            </div>

            <p className="mt-4 flex items-center gap-2 text-sm text-ash">
              <span className={`h-2 w-2 rounded-full ${product.inStock ? "bg-emerald-500" : "bg-mist"}`} />
              {product.inStock ? "Dostępny - wysyłamy w 24h" : "Chwilowo niedostępny"}
            </p>
            {product.inStock && product.lowStock != null && (
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-orange-deep">
                <span aria-hidden="true">⏳</span>
                {product.lowStock === 1
                  ? "Została ostatnia sztuka - wysyłamy w 24h"
                  : `Zostały tylko ${product.lowStock} szt. - wysyłamy w 24h`}
              </p>
            )}

            <p className="mt-2 flex items-center gap-2 text-sm text-ash">
              <span aria-hidden="true">🐾</span>
              Pakowane z miłością - i pod czujnym okiem kota.
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

      <ProductReviews slug={product.slug} />

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

      <RecentlyViewed currentSlug={product.slug} record />
    </div>
  );
}
