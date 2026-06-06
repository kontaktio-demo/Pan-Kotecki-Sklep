import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { mapProduct, PRODUCT_SELECT, type ProductRow } from "../lib/mappers.js";

export const catalogRouter = Router();

catalogRouter.get("/categories", async (_req, res) => {
  const { data, error } = await supabase
    .from("categories")
    .select("slug, name, tagline")
    .order("sort_order", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

catalogRouter.get("/products", async (req, res) => {
  const kategoria = typeof req.query.kategoria === "string" ? req.query.kategoria : null;
  const szukaj = typeof req.query.szukaj === "string" ? req.query.szukaj.trim() : "";

  let query = supabase.from("products").select(PRODUCT_SELECT).eq("active", true);

  if (kategoria) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", kategoria)
      .maybeSingle();
    if (cat?.id) query = query.eq("category_id", cat.id);
  }

  if (szukaj) {
    query = query.or(`name.ilike.%${szukaj}%,short_description.ilike.%${szukaj}%`);
  }

  const { data, error } = await query.order("sort_order", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json((data as unknown as ProductRow[]).map(mapProduct));
});

catalogRouter.get("/products/:slug", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", req.params.slug)
    .eq("active", true)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Nie znaleziono produktu" });
  res.json(mapProduct(data as unknown as ProductRow));
});
