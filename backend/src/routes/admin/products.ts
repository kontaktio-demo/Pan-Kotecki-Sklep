import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { supabase } from "../../lib/supabase.js";
import { parseBody, serverError, slugify, UUID_RE } from "../../lib/util.js";

export const productsRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const BUCKET = "product-images";
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  category_id: z.string().uuid().nullable().optional(),
  price_grosze: z.number().int().min(0),
  sale_price_grosze: z.number().int().min(0).nullable().optional(),
  short_description: z.string().optional().default(""),
  description: z.string().optional().default(""),
  details: z.array(z.string()).optional().default([]),
  badges: z.array(z.string()).optional().default([]),
  bestseller: z.boolean().optional().default(false),
  in_stock: z.boolean().optional().default(true),
  stock_qty: z.number().int().nullable().optional(),
  active: z.boolean().optional().default(true),
  sort_order: z.number().int().optional().default(0),
});

const SELECT = "*, category:categories(slug, name), images:product_images(id, url, alt, sort_order)";

productsRouter.get("/", async (_req, res) => {
  const { data, error } = await supabase.from("products").select(SELECT).order("sort_order");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

productsRouter.get("/:id", async (req, res) => {
  const { data, error } = await supabase.from("products").select(SELECT).eq("id", req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Nie znaleziono" });
  res.json(data);
});

productsRouter.post("/", async (req, res) => {
  const body = parseBody(productSchema, req.body, res);
  if (!body) return;
  const slug = body.slug?.trim() ? slugify(body.slug) : slugify(body.name);
  const { data, error } = await supabase
    .from("products")
    .insert({ ...body, slug })
    .select(SELECT)
    .single();
  if (error) return res.status(error.code === "23505" ? 409 : 500).json({ error: error.message });
  res.status(201).json(data);
});

productsRouter.patch("/:id", async (req, res) => {
  const body = parseBody(productSchema.partial(), req.body, res);
  if (!body) return;
  const patch: Record<string, unknown> = { ...body };
  if (typeof body.slug === "string") patch.slug = slugify(body.slug);
  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", req.params.id)
    .select(SELECT)
    .maybeSingle();
  if (error) return res.status(error.code === "23505" ? 409 : 500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Nie znaleziono" });
  res.json(data);
});

productsRouter.delete("/:id", async (req, res) => {
  const { data: imgs } = await supabase.from("product_images").select("storage_path").eq("product_id", req.params.id);
  const paths = (imgs ?? []).map((i) => i.storage_path).filter(Boolean) as string[];
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
  const { error } = await supabase.from("products").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// Upload zdjęcia produktu → Supabase Storage + wiersz product_images.
productsRouter.post("/:id/images", upload.single("file"), async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(400).json({ error: "Błędne ID produktu" });

  const file = req.file;
  if (!file) return res.status(400).json({ error: "Brak pliku (pole 'file')" });
  if (file.size > 8 * 1024 * 1024) return res.status(413).json({ error: "Plik za duży (max 8 MB)" });

  const ext = (file.originalname.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
    return res.status(400).json({ error: "Dozwolone tylko obrazy (JPG, PNG, WebP, GIF, AVIF)" });
  }
  const alt = typeof req.body?.alt === "string" ? req.body.alt.slice(0, 255) : null;
  const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
  if (upErr) return serverError(res, "image.upload", upErr);

  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { data: last } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", id)
    .order("sort_order", { ascending: false })
    .limit(1);
  const sort_order = (last?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: id, url, storage_path: path, alt, sort_order })
    .select()
    .single();
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]); // cofnij wgrany plik
    return serverError(res, "image.insert", error);
  }
  res.status(201).json(data);
});

productsRouter.delete("/images/:imageId", async (req, res) => {
  const { data: img } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("id", req.params.imageId)
    .maybeSingle();
  if (img?.storage_path) await supabase.storage.from(BUCKET).remove([img.storage_path]);
  const { error } = await supabase.from("product_images").delete().eq("id", req.params.imageId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
