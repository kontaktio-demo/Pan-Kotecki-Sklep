import type { Metadata } from "next";
import Link from "next/link";
import { getProducts, getCategories } from "@/lib/products";
import ShopClient from "@/components/shop/ShopClient";

export const metadata: Metadata = {
  title: "Sklep",
  description:
    "Zabawki, akcesoria, kubki i drobiazgi dla właścicieli kotów. Filtruj, sortuj i zamawiaj — wysyłka w 24h.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ kategoria?: string; szukaj?: string }>;
}) {
  const sp = await searchParams;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const valid = categories.some((c) => c.slug === sp.kategoria) ? (sp.kategoria as string) : "wszystko";
  const search = sp.szukaj ?? "";

  return (
    <div className="pt-5 md:pt-7">
      <div className="container-edge">
        <nav className="flex items-center gap-2 text-sm text-ash">
          <Link href="/" className="transition-colors hover:text-ink">Strona główna</Link>
          <span>/</span>
          <span className="text-ink">Sklep</span>
        </nav>
      </div>

      <ShopClient
        key={`${valid}-${search}`}
        products={products}
        categories={categories}
        initialCategory={valid}
        initialSearch={search}
      />
    </div>
  );
}
