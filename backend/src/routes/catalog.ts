import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { parseBody, serverError } from "../lib/util.js";
import { mapProduct, PRODUCT_SELECT, type ProductRow } from "../lib/mappers.js";

export const catalogRouter = Router();

// usuwa znaki specjalne PostgREST (`,` `(` `)` `*` `%` itd.) z frazy szukania
function safeTerm(input: string): string {
  return input.replace(/[^\p{L}\p{N}\s-]/gu, " ").trim().slice(0, 60);
}

// cache na CDN/przeglądarce - mniej zapytań do bazy, lepsza skalowalność
function cache(res: import("express").Response, sMaxAge: number) {
  res.set("Cache-Control", `public, max-age=30, s-maxage=${sMaxAge}, stale-while-revalidate=600`);
}

catalogRouter.get("/categories", async (_req, res) => {
  const { data, error } = await supabase
    .from("categories")
    .select("slug, name, tagline")
    .order("sort_order", { ascending: true });
  if (error) return serverError(res, "categories", error);
  cache(res, 300);
  res.json(data ?? []);
});

catalogRouter.get("/products", async (req, res) => {
  const kategoria = typeof req.query.kategoria === "string" ? req.query.kategoria.slice(0, 80) : null;
  const szukaj = typeof req.query.szukaj === "string" ? safeTerm(req.query.szukaj) : "";
  // hydracja ulubionych / ostatnio oglądanych: ?slugi=a,b,c (max 50)
  const slugi =
    typeof req.query.slugi === "string"
      ? req.query.slugi.split(",").map((s) => s.trim().slice(0, 80)).filter(Boolean).slice(0, 50)
      : null;

  let query = supabase.from("products").select(PRODUCT_SELECT).eq("active", true);

  if (slugi && slugi.length > 0) {
    query = query.in("slug", slugi);
  }

  if (kategoria) {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", kategoria).maybeSingle();
    if (cat?.id) query = query.eq("category_id", cat.id);
    else return res.json([]);
  }

  if (szukaj) {
    query = query.or(`name.ilike.%${szukaj}%,short_description.ilike.%${szukaj}%`);
  }

  const { data, error } = await query.order("sort_order", { ascending: true });
  if (error) return serverError(res, "products", error);
  cache(res, 120);
  res.json((data as unknown as ProductRow[]).map(mapProduct));
});

// Podpowiedzi wyszukiwarki (dropdown w nagłówku sklepu). Musi być PRZED /products/:slug,
// inaczej Express potraktuje "suggest" jako slug.
catalogRouter.get("/products/suggest", async (req, res) => {
  const q = typeof req.query.q === "string" ? safeTerm(req.query.q) : "";
  if (q.length < 2) return res.json([]);
  const { data, error } = await supabase
    .from("products")
    .select("slug, name, price_grosze, sale_price_grosze, images:product_images(url, sort_order)")
    .eq("active", true)
    .or(`name.ilike.%${q}%,short_description.ilike.%${q}%`)
    .order("bestseller", { ascending: false })
    .limit(8);
  if (error) return serverError(res, "suggest", error);
  cache(res, 60);
  res.json(
    (data ?? []).map((p) => ({
      slug: p.slug,
      name: p.name,
      price: p.price_grosze / 100,
      salePrice: p.sale_price_grosze != null ? p.sale_price_grosze / 100 : null,
      image:
        (p.images ?? [])
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((i) => i.url)[0] ?? null,
    })),
  );
});

catalogRouter.get("/products/:slug", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", req.params.slug)
    .eq("active", true)
    .maybeSingle();
  if (error) return serverError(res, "product", error);
  if (!data) return res.status(404).json({ error: "Nie znaleziono produktu" });
  cache(res, 300);
  res.json(mapProduct(data as unknown as ProductRow));
});

// Publiczny status zamówienia po numerze (tylko stan płatności/realizacji, bez PII).
// Używane przez stronę „dziękujemy" do pokazania realnego stanu (BLIK/Przelewy24).
catalogRouter.get("/order-status/:number", async (req, res) => {
  const number = String(req.params.number).slice(0, 40);
  const { data, error } = await supabase
    .from("orders")
    .select("payment_status, status, tracking_number, history:order_status_history(status, created_at)")
    .eq("number", number)
    .maybeSingle();
  if (error) return serverError(res, "order-status", error);
  if (!data) return res.status(404).json({ error: "Nie znaleziono" });
  const history = ((data.history ?? []) as { status: string; created_at: string }[])
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((h) => ({ status: h.status, at: h.created_at }));
  res.set("Cache-Control", "no-store");
  res.json({
    paymentStatus: data.payment_status,
    status: data.status,
    trackingNumber: data.tracking_number ?? null,
    history,
  });
});

// Publiczne ustawienia sklepu (próg darmowej dostawy, koszty dostawy, ogłoszenie).
catalogRouter.get("/settings/public", async (_req, res) => {
  const { data } = await supabase.from("settings").select("value").eq("key", "store").maybeSingle();
  const store = (data?.value ?? {}) as {
    free_shipping_grosze?: number;
    open?: boolean;
    shipping_locker_grosze?: number;
    shipping_courier_grosze?: number;
    announcement?: string;
  };
  const num = (v: unknown, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  const open = store.open !== false; // domyślnie otwarty; zamknięty tylko gdy jawnie false
  // krótki cache - żeby włącznik „Wkrótce/Otwarty" działał szybko (~30 s)
  res.set("Cache-Control", "public, max-age=15, s-maxage=30, stale-while-revalidate=60");
  res.json({
    freeShippingGrosze: num(store.free_shipping_grosze, 14900),
    shippingLockerGrosze: num(store.shipping_locker_grosze, 1199),
    shippingCourierGrosze: num(store.shipping_courier_grosze, 1499),
    announcement: typeof store.announcement === "string" ? store.announcement.slice(0, 200) : "",
    open,
  });
});

// Walidacja kodu rabatowego PRZED kasą (podgląd rabatu) - NIE zwiększa licznika użyć.
const validateSchema = z.object({ code: z.string().min(1).max(40), subtotal_grosze: z.number().int().min(0) });
catalogRouter.post("/promo/validate", async (req, res) => {
  const body = parseBody(validateSchema, req.body, res);
  if (!body) return;
  const { data: promo } = await supabase.from("promotions").select("*").eq("code", body.code.toUpperCase()).maybeSingle();
  const now = Date.now();
  const valid =
    promo &&
    promo.active &&
    body.subtotal_grosze >= (promo.min_order_grosze ?? 0) &&
    (!promo.starts_at || new Date(promo.starts_at).getTime() <= now) &&
    (!promo.ends_at || new Date(promo.ends_at).getTime() >= now) &&
    (promo.usage_limit == null || promo.used_count < promo.usage_limit);
  if (!valid) {
    res.set("Cache-Control", "no-store");
    return res.json({ valid: false, discountGrosze: 0, message: "Kod nieprawidłowy lub niespełnione warunki." });
  }
  let discount =
    promo.kind === "percent"
      ? Math.floor((body.subtotal_grosze * Math.min(Math.max(promo.value, 0), 100)) / 100)
      : Math.max(promo.value, 0);
  discount = Math.max(0, Math.min(discount, body.subtotal_grosze));
  res.set("Cache-Control", "no-store");
  res.json({ valid: true, discountGrosze: discount, code: promo.code });
});
