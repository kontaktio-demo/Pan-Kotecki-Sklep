import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProducts, getProductBySlug, getRelated, categoryName } from "@/lib/products";
import { formatPrice, productRating, FREE_SHIPPING_FROM } from "@/lib/format";
import ProductMedia from "@/components/shop/ProductMedia";
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
    motif: product.visual.motif,
    tone: product.visual.tone,
    image: product.images?.[0],
  };

  return (
    <div className="pt-6 md:pt-8">
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

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-cream">
            <ProductMedia
              image={item.image}
              name={product.name}
              motif={item.motif}
              sizes="(min-width: 1024px) 40rem, 100vw"
              priority
            />
            {product.badges && product.badges.length > 0 && (
              <span className="absolute left-4 top-4 rounded-md bg-coral px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {product.badges[0]}
              </span>
            )}
          </div>

          <div className="lg:py-2">
            <p className="text-sm text-ash">{categoryName(product.category)}</p>
            <h1 className="mt-1 text-3xl font-semibold leading-tight md:text-4xl">{product.name}</h1>

            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-coral" aria-hidden="true">{"★".repeat(Math.round(rating))}</span>
              <span className="text-ash">{rating.toFixed(1)} · {reviews} opinii</span>
            </div>

            <p className="mt-5 text-3xl font-semibold tabular-nums">{formatPrice(product.price)}</p>
            <p className={`mt-1 text-sm ${freeShipping ? "text-emerald-600" : "text-ash"}`}>
              {freeShipping ? "Darmowa dostawa" : `Darmowa dostawa od ${FREE_SHIPPING_FROM} zł`}
            </p>

            <p className="mt-6 max-w-md leading-relaxed text-ink-soft">{product.description}</p>

            <div className="mt-8">
              <AddToCartFull item={item} />
            </div>

            <p className="mt-4 flex items-center gap-2 text-sm text-ash">
              <span className={`h-2 w-2 rounded-full ${product.inStock ? "bg-emerald-500" : "bg-mist"}`} />
              {product.inStock ? "Dostępny — wysyłka w 24h" : "Chwilowo niedostępny"}
            </p>

            <dl className="mt-8 divide-y divide-line border-t border-line">
              {product.details.map((d) => (
                <div key={d} className="py-3 text-sm text-ink-soft">
                  {d}
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-edge mt-20 md:mt-28">
          <h2 className="mb-7 text-2xl font-semibold">Podobne produkty</h2>
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
