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
    <div className="pt-8 md:pt-10">
      <div className="container-edge mb-6">
        <nav className="mb-3 flex items-center gap-2 text-sm text-ash">
          <Link href="/" className="transition-colors hover:text-ink">Strona główna</Link>
          <span>/</span>
          <span className="text-ink">Sklep</span>
        </nav>
        <h1 className="text-3xl font-semibold md:text-4xl">Sklep</h1>
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
