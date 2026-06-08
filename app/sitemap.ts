import type { MetadataRoute } from "next";
import { getProducts, getCategories } from "@/lib/products";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pankotecki.pl";

export const revalidate = 3600; // odśwież mapę co godzinę

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    getProducts().catch(() => []),
    getCategories().catch(() => []),
  ]);
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${site}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${site}/sklep`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${site}/o-nas`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site}/kontakt`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site}/regulamin`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site}/zwroty`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site}/polityka-prywatnosci`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${site}/sklep?kategoria=${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${site}/sklep/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
