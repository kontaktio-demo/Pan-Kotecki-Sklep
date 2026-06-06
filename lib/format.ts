export function formatPrice(value: number, currency: "PLN" = "PLN"): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export const FREE_SHIPPING_FROM = 149;

export function productRating(slug: string): { rating: number; reviews: number } {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const rating = Math.round((4.5 + (h % 5) / 10) * 10) / 10;
  const reviews = 8 + (h % 230);
  return { rating, reviews };
}
