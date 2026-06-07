// Sieje 20 produktów do żywego API panelu (POST /api/admin/products).
// Użycie: B=<backend-url> K=<admin-key> npx tsx scripts/seed-api.ts
import { getProducts } from "../lib/products";

const B = (process.env.B || "").replace(/\/$/, "");
const K = process.env.K || "";

async function main() {
  if (!B || !K) throw new Error("Podaj B (URL backendu) i K (ADMIN_API_KEY).");

  const cats: { slug: string; id: string }[] = await fetch(`${B}/api/admin/categories`, {
    headers: { "x-admin-key": K },
  }).then((r) => r.json());
  const map: Record<string, string> = {};
  for (const c of cats) map[c.slug] = c.id;

  const products = await getProducts();
  let ok = 0;
  let fail = 0;
  for (const [i, p] of products.entries()) {
    const payload = {
      name: p.name,
      slug: p.slug,
      category_id: map[p.category] ?? null,
      price_grosze: Math.round(p.price * 100),
      short_description: p.shortDescription,
      description: p.description,
      details: p.details,
      badges: p.badges ?? [],
      bestseller: !!p.bestseller,
      in_stock: p.inStock,
      active: true,
      sort_order: i + 1,
    };
    const r = await fetch(`${B}/api/admin/products`, {
      method: "POST",
      headers: { "x-admin-key": K, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      ok++;
    } else {
      fail++;
      console.log("FAIL", p.slug, r.status, (await r.text()).slice(0, 140));
    }
  }
  console.log(`Gotowe: dodano ${ok}, błędów ${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
