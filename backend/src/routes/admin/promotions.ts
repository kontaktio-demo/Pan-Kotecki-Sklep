import { Router } from "express";
import { z } from "zod";
import { supabase } from "../../lib/supabase.js";
import { parseBody } from "../../lib/util.js";

export const promotionsRouter = Router();

const base = z.object({
  code: z.string().min(2),
  name: z.string().optional().default(""),
  kind: z.enum(["percent", "fixed"]).default("percent"),
  value: z.number().int().min(0),
  min_order_grosze: z.number().int().min(0).optional().default(0),
  active: z.boolean().optional().default(true),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  usage_limit: z.number().int().min(0).nullable().optional(),
});

const schema = base.superRefine((d, ctx) => {
  if (d.kind === "percent" && d.value > 100) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "Rabat procentowy nie może przekraczać 100%" });
  }
});

promotionsRouter.get("/", async (_req, res) => {
  const { data, error } = await supabase.from("promotions").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

promotionsRouter.post("/", async (req, res) => {
  const body = parseBody(schema, req.body, res);
  if (!body) return;
  const { data, error } = await supabase
    .from("promotions")
    .insert({ ...body, code: body.code.toUpperCase() })
    .select()
    .single();
  if (error) return res.status(error.code === "23505" ? 409 : 500).json({ error: error.message });
  res.status(201).json(data);
});

promotionsRouter.patch("/:id", async (req, res) => {
  const body = parseBody(base.partial(), req.body, res);
  if (!body) return;
  const patch: Record<string, unknown> = { ...body };
  if (typeof body.code === "string") patch.code = body.code.toUpperCase();
  const { data, error } = await supabase.from("promotions").update(patch).eq("id", req.params.id).select().maybeSingle();
  if (error) return res.status(error.code === "23505" ? 409 : 500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Nie znaleziono" });
  res.json(data);
});

promotionsRouter.delete("/:id", async (req, res) => {
  const { error } = await supabase.from("promotions").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
