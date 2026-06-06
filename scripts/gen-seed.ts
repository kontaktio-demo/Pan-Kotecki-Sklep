// Generuje supabase/seed_products.sql z danych w lib/products.ts.
// Uruchom: npx tsx scripts/gen-seed.ts
import { writeFileSync } from "node:fs";
import { getProducts } from "../lib/products";

const esc = (s: string) => `'${String(s).replace(/'/g, "''")}'`;
const arr = (a: string[]) =>
  a.length ? `ARRAY[${a.map(esc).join(", ")}]::text[]` : `'{}'::text[]`;

async function main() {
const products = await getProducts();

const rows = products.map((p, i) => {
  const cat = `(select id from categories where slug = ${esc(p.category)})`;
  return `(${esc(p.slug)}, ${esc(p.name)}, ${cat}, ${Math.round(p.price * 100)}, ${esc(
    p.shortDescription,
  )}, ${esc(p.description)}, ${arr(p.details)}, ${arr(p.badges ?? [])}, ${p.bestseller ?? false}, ${
    p.inStock
  }, ${i + 1})`;
});

const sql = `-- Pan Kotecki — produkty startowe (wygenerowane z lib/products.ts).
-- Wklej w Supabase SQL Editor i uruchom (wymaga wcześniej seed.sql z kategoriami).

insert into products
  (slug, name, category_id, price_grosze, short_description, description, details, badges, bestseller, in_stock, sort_order)
values
${rows.join(",\n")}
on conflict (slug) do nothing;
`;

writeFileSync("supabase/seed_products.sql", sql);
console.log(`Zapisano supabase/seed_products.sql (${products.length} produktów)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
