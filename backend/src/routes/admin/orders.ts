import { Router } from "express";
import { z } from "zod";
import { supabase } from "../../lib/supabase.js";
import { parseBody } from "../../lib/util.js";

export const ordersRouter = Router();

const SELECT = "*, items:order_items(*)";
const STATUSES = new Set(["pending", "paid", "packed", "shipped", "delivered", "cancelled", "refunded"]);

ordersRouter.get("/", async (req, res) => {
  const raw = typeof req.query.status === "string" ? req.query.status : null;
  const status = raw && STATUSES.has(raw) ? raw : null;
  let q = supabase.from("orders").select(SELECT).order("created_at", { ascending: false }).limit(500);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

ordersRouter.get("/:id", async (req, res) => {
  const { data, error } = await supabase.from("orders").select(SELECT).eq("id", req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Nie znaleziono" });
  res.json(data);
});

const patchSchema = z.object({
  status: z.enum(["pending", "paid", "packed", "shipped", "delivered", "cancelled", "refunded"]).optional(),
  payment_status: z.enum(["unpaid", "paid", "failed", "refunded"]).optional(),
  tracking_number: z.string().nullable().optional(),
  label_url: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  parcel_locker: z.string().nullable().optional(),
});

ordersRouter.patch("/:id", async (req, res) => {
  const body = parseBody(patchSchema, req.body, res);
  if (!body) return;
  const { data, error } = await supabase.from("orders").update(body).eq("id", req.params.id).select(SELECT).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Nie znaleziono" });
  res.json(data);
});
