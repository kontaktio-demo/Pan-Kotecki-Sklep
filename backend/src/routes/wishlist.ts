import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { parseBody, serverError } from "../lib/util.js";
import { requireCustomer, type CustomerRequest } from "../lib/customerAuth.js";

// Ulubione produkty zalogowanego klienta. Goście trzymają listę w localStorage;
// po zalogowaniu sklep robi PUT /sync i listy się scalają.
export const wishlistRouter = Router();
wishlistRouter.use(requireCustomer);

async function listSlugs(userId: string): Promise<string[] | null> {
  const { data, error } = await supabase
    .from("wishlists")
    .select("product:products(slug)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return null;
  return (data ?? [])
    .map((r) => (r.product as unknown as { slug: string } | null)?.slug)
    .filter((s): s is string => Boolean(s));
}

wishlistRouter.get("/", async (req: CustomerRequest, res) => {
  const slugs = await listSlugs(req.customer!.id);
  if (slugs === null) return serverError(res, "wishlist.list", null);
  res.json({ slugs });
});

wishlistRouter.post("/:slug", async (req: CustomerRequest, res) => {
  const slug = String(req.params.slug).slice(0, 80);
  const { data: product } = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
  if (!product) return res.status(404).json({ error: "Nie znaleziono produktu" });
  const { error } = await supabase
    .from("wishlists")
    .upsert({ user_id: req.customer!.id, product_id: product.id }, { onConflict: "user_id,product_id" });
  if (error) return serverError(res, "wishlist.add", error);
  res.status(201).json({ ok: true });
});

wishlistRouter.delete("/:slug", async (req: CustomerRequest, res) => {
  const slug = String(req.params.slug).slice(0, 80);
  const { data: product } = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
  if (!product) return res.status(404).json({ error: "Nie znaleziono produktu" });
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("user_id", req.customer!.id)
    .eq("product_id", product.id);
  if (error) return serverError(res, "wishlist.remove", error);
  res.json({ ok: true });
});

// Scala lokalną listę gościa z listą konta (unia) i zwraca wynik.
const syncSchema = z.object({ slugs: z.array(z.string().max(80)).max(200) });
wishlistRouter.put("/sync", async (req: CustomerRequest, res) => {
  const body = parseBody(syncSchema, req.body, res);
  if (!body) return;
  const userId = req.customer!.id;

  if (body.slugs.length > 0) {
    const { data: products } = await supabase.from("products").select("id").in("slug", body.slugs);
    const rows = (products ?? []).map((p) => ({ user_id: userId, product_id: p.id }));
    if (rows.length > 0) {
      const { error } = await supabase.from("wishlists").upsert(rows, { onConflict: "user_id,product_id" });
      if (error) return serverError(res, "wishlist.sync", error);
    }
  }

  const slugs = await listSlugs(userId);
  if (slugs === null) return serverError(res, "wishlist.sync.list", null);
  res.json({ slugs });
});
