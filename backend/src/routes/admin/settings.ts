import { Router } from "express";
import { z } from "zod";
import { supabase } from "../../lib/supabase.js";
import { parseBody, serverError } from "../../lib/util.js";

export const settingsRouter = Router();

// Każdy klucz ustawień ma własny schemat - złe dane nie zepsują kasy/sklepu.
// strict-strip: nieznane pola wycinamy, znane walidujemy.
const SCHEMAS: Record<string, z.ZodTypeAny> = {
  store: z
    .object({
      free_shipping_grosze: z.number().int().min(0).max(100_000_00),
      open: z.boolean(),
      currency: z.literal("PLN"),
      shipping_locker_grosze: z.number().int().min(0).max(100_000_00),
      shipping_courier_grosze: z.number().int().min(0).max(100_000_00),
      low_stock_threshold: z.number().int().min(0).max(1000),
      announcement: z.string().max(200),
    })
    .partial(),
  shipping: z.object({}).passthrough(),
  contact: z
    .object({
      email: z.string().email().max(160),
      phone: z.string().max(40),
    })
    .partial(),
  payments: z.object({}).passthrough(),
};

settingsRouter.get("/", async (_req, res) => {
  const { data, error } = await supabase.from("settings").select("*");
  if (error) return serverError(res, "settings.list", error);
  const map: Record<string, unknown> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  res.json(map);
});

settingsRouter.put("/:key", async (req, res) => {
  const key = req.params.key;
  const schema = SCHEMAS[key];
  if (!schema) return res.status(400).json({ error: "Nieznany klucz ustawień" });

  const raw = req.body?.value ?? req.body ?? {};
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return res.status(400).json({ error: "Wartość ustawienia musi być obiektem" });
  }
  const value = parseBody(schema, raw, res);
  if (!value) return;

  // Scal z istniejącą wartością (PUT z panelu wysyła tylko edytowane pola).
  const { data: cur } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
  const merged = { ...((cur?.value as object) ?? {}), ...(value as object) };

  const { data, error } = await supabase
    .from("settings")
    .upsert({ key, value: merged, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) return serverError(res, "settings.upsert", error);
  res.json(data);
});
