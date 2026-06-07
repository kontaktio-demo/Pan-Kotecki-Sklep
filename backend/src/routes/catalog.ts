import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { serverError } from "../lib/util.js";
import { mapProduct, PRODUCT_SELECT, type ProductRow } from "../lib/mappers.js";

export const catalogRouter = Router();

// usuwa znaki specjalne PostgREST (`,` `(` `)` `*` `%` itd.) z frazy szukania
function safeTerm(input: string): string {
  return input.replace(/[^\p{L}\p{N}\s-]/gu, " ").trim().slice(0, 60);
}

// cache na CDN/przeglądarce — mniej zapytań do bazy, lepsza skalowalność
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

  let query = supabase.from("products").select(PRODUCT_SELECT).eq("active", true);

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
    .select("payment_status, status")
    .eq("number", number)
    .maybeSingle();
  if (error) return serverError(res, "order-status", error);
  if (!data) return res.status(404).json({ error: "Nie znaleziono" });
  res.set("Cache-Control", "no-store");
  res.json({ paymentStatus: data.payment_status, status: data.status });
});
