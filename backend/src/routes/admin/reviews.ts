import { Router } from "express";
import { z } from "zod";
import { supabase } from "../../lib/supabase.js";
import { badId, parseBody, serverError } from "../../lib/util.js";

// Moderacja opinii: pending → approved/rejected. Zatwierdzenie automatycznie
// przelicza średnią ocenę produktu (trigger w bazie).
export const reviewsAdminRouter = Router();

const STATUSES = new Set(["pending", "approved", "rejected"]);
const SELECT =
  "id, rating, body, author_name, status, verified, created_at, product:products(name, slug), order:orders(number, email)";

reviewsAdminRouter.get("/", async (req, res) => {
  const raw = typeof req.query.status === "string" ? req.query.status : null;
  const status = raw && STATUSES.has(raw) ? raw : null;
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 50));
  const offset = Math.max(0, Number(req.query.offset) || 0);

  let q = supabase
    .from("product_reviews")
    .select(SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (status) q = q.eq("status", status);

  const { data, error, count } = await q;
  if (error) return serverError(res, "reviews.admin.list", error);
  res.json({ items: data ?? [], total: count ?? 0 });
});

const patchSchema = z.object({ status: z.enum(["approved", "rejected", "pending"]) });

reviewsAdminRouter.patch("/:id", async (req, res) => {
  if (badId(res, req.params.id)) return;
  const body = parseBody(patchSchema, req.body, res);
  if (!body) return;
  const { data, error } = await supabase
    .from("product_reviews")
    .update({ status: body.status })
    .eq("id", req.params.id)
    .select(SELECT)
    .maybeSingle();
  if (error) return serverError(res, "reviews.admin.update", error);
  if (!data) return res.status(404).json({ error: "Nie znaleziono" });
  res.json(data);
});

reviewsAdminRouter.delete("/:id", async (req, res) => {
  if (badId(res, req.params.id)) return;
  const { error } = await supabase.from("product_reviews").delete().eq("id", req.params.id);
  if (error) return serverError(res, "reviews.admin.delete", error);
  res.json({ ok: true });
});
