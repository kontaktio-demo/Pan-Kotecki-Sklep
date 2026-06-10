// Mapowanie wiersza z bazy → kształt, którego oczekuje sklep (ceny w zł).

type ImageRow = { url: string; alt: string | null; sort_order: number };
type CategoryRow = { slug: string; name: string } | null;

export type ProductRow = {
  slug: string;
  name: string;
  price_grosze: number;
  sale_price_grosze: number | null;
  currency: string;
  short_description: string | null;
  description: string | null;
  details: string[] | null;
  badges: string[] | null;
  bestseller: boolean;
  in_stock: boolean;
  stock_qty: number | null;
  rating_avg: number | string | null;
  rating_count: number | null;
  category: CategoryRow;
  images: ImageRow[] | null;
};

// Publicznie zdradzamy stan magazynu tylko jako "ostatnie sztuki" (≤5).
const LOW_STOCK_MAX = 5;

export function mapProduct(row: ProductRow) {
  const images = (row.images ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => i.url);

  return {
    slug: row.slug,
    name: row.name,
    category: row.category?.slug ?? null,
    categoryName: row.category?.name ?? null,
    price: row.price_grosze / 100,
    salePrice: row.sale_price_grosze != null ? row.sale_price_grosze / 100 : null,
    currency: row.currency,
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    details: row.details ?? [],
    badges: row.badges ?? [],
    bestseller: row.bestseller,
    inStock: row.in_stock,
    lowStock:
      row.stock_qty != null && row.stock_qty > 0 && row.stock_qty <= LOW_STOCK_MAX
        ? row.stock_qty
        : null,
    ratingAvg: row.rating_avg != null ? Number(row.rating_avg) : null,
    ratingCount: row.rating_count ?? 0,
    images,
  };
}

export const PRODUCT_SELECT =
  "slug, name, price_grosze, sale_price_grosze, currency, short_description, description, details, badges, bestseller, in_stock, stock_qty, rating_avg, rating_count, category:categories(slug, name), images:product_images(url, alt, sort_order)";
