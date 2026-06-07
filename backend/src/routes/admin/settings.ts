import { Router } from "express";
import { supabase } from "../../lib/supabase.js";
import { serverError } from "../../lib/util.js";

export const settingsRouter = Router();

// dozwolone klucze ustawień (whitelist)
const ALLOWED_KEYS = new Set(["store", "shipping", "contact", "payments"]);

settingsRouter.get("/", async (_req, res) => {
  const { data, error } = await supabase.from("settings").select("*");
  if (error) return serverError(res, "settings.list", error);
  const map: Record<string, unknown> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  res.json(map);
});

settingsRouter.put("/:key", async (req, res) => {
  const key = req.params.key;
  if (!ALLOWED_KEYS.has(key)) return res.status(400).json({ error: "Nieznany klucz ustawień" });

  const value = req.body?.value ?? req.body ?? {};
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return res.status(400).json({ error: "Wartość ustawienia musi być obiektem" });
  }

  const { data, error } = await supabase
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) return serverError(res, "settings.upsert", error);
  res.json(data);
});
