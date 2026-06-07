import { Router } from "express";
import { z } from "zod";
import { supabase } from "../../lib/supabase.js";
import { parseBody, slugify } from "../../lib/util.js";

export const categoriesRouter = Router();

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  tagline: z.string().optional().default(""),
  sort_order: z.number().int().optional().default(0),
});

categoriesRouter.get("/", async (_req, res) => {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

categoriesRouter.post("/", async (req, res) => {
  const body = parseBody(schema, req.body, res);
  if (!body) return;
  const slug = body.slug?.trim() ? slugify(body.slug) : slugify(body.name);
  const { data, error } = await supabase.from("categories").insert({ ...body, slug }).select().single();
  if (error) return res.status(error.code === "23505" ? 409 : 500).json({ error: error.message });
  res.status(201).json(data);
});

categoriesRouter.patch("/:id", async (req, res) => {
  const body = parseBody(schema.partial(), req.body, res);
  if (!body) return;
  const patch: Record<string, unknown> = { ...body };
  if (typeof body.slug === "string") patch.slug = slugify(body.slug);
  const { data, error } = await supabase.from("categories").update(patch).eq("id", req.params.id).select().maybeSingle();
  if (error) return res.status(error.code === "23505" ? 409 : 500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Nie znaleziono" });
  res.json(data);
});

categoriesRouter.delete("/:id", async (req, res) => {
  const { error } = await supabase.from("categories").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
