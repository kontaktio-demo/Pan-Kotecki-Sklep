import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { z } from "zod";
import { supabase } from "../../lib/supabase.js";
import { badId, parseBody, serverError, slugify, UUID_RE, writeError } from "../../lib/util.js";

export const productsRouter = Router();

const BUCKET = "product-images";
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);
const MAX_DIM = 1600; // px - większe zdjęcia zmniejszamy (szybsze ładowanie)
const MAX_PIXELS = 40_000_000; // ~40 Mpx - twardy limit dekodowania (anty decompression-bomb)

// Wstępny filtr po nagłówkach (szybkie odrzucenie zanim zbuforujemy plik).
// Prawdziwą walidacją jest i tak sharp - odrzuci wszystko, co nie jest obrazem.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = (file.originalname.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.has(ext)) cb(null, true);
    else cb(null, false);
  },
});

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
  if (error) return serverError(res, "products.list", error);
  res.json(data ?? []);
});

// Produkty z niskim stanem magazynowym (próg z ustawień albo ?threshold=).
// Rejestrowane PRZED /:id ("low-stock" nie jest UUID).
productsRouter.get("/low-stock", async (req, res) => {
  let threshold = Number(req.query.threshold);
  if (!Number.isFinite(threshold) || threshold < 0) {
    const { data: s } = await supabase.from("settings").select("value").eq("key", "store").maybeSingle();
    const t = Number((s?.value as { low_stock_threshold?: number } | null)?.low_stock_threshold);
    threshold = Number.isFinite(t) && t >= 0 ? t : 5;
  }
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, stock_qty, in_stock, active, images:product_images(url, sort_order)")
    .not("stock_qty", "is", null)
    .lte("stock_qty", threshold)
    .eq("active", true)
    .order("stock_qty", { ascending: true })
    .limit(100);
  if (error) return serverError(res, "products.lowstock", error);
  res.json({ threshold, items: data ?? [] });
});

productsRouter.get("/:id", async (req, res) => {
  if (badId(res, req.params.id)) return;
  const { data, error } = await supabase.from("products").select(SELECT).eq("id", req.params.id).maybeSingle();
  if (error) return serverError(res, "products.get", error);
  if (!data) return res.status(404).json({ error: "Nie znaleziono" });
  res.json(data);
});

// Duplikuj produkt: kopia jako szkic (active=false), unikalny slug.
// Zdjęcia kopiujemy TYLKO jako URL (storage_path=null) - usunięcie kopii
// nigdy nie skasuje plików oryginału ze Storage.
productsRouter.post("/:id/duplicate", async (req, res) => {
  if (badId(res, req.params.id)) return;
  const { data: src, error } = await supabase
    .from("products")
    .select("*, images:product_images(url, alt, sort_order)")
    .eq("id", req.params.id)
    .maybeSingle();
  if (error) return serverError(res, "products.duplicate.get", error);
  if (!src) return res.status(404).json({ error: "Nie znaleziono" });

  const baseSlug = slugify(`${src.slug}-kopia`);
  let slug = baseSlug;
  for (let i = 2; i <= 20; i++) {
    const { data: taken } = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
    if (!taken) break;
    slug = slugify(`${baseSlug}-${i}`);
  }

  const { data: copy, error: insErr } = await supabase
    .from("products")
    .insert({
      slug,
      name: `${src.name} (kopia)`,
      category_id: src.category_id,
      price_grosze: src.price_grosze,
      sale_price_grosze: src.sale_price_grosze,
      currency: src.currency,
      short_description: src.short_description,
      description: src.description,
      details: src.details,
      badges: src.badges,
      bestseller: false,
      in_stock: src.in_stock,
      stock_qty: src.stock_qty,
      active: false,
      sort_order: (src.sort_order ?? 0) + 1,
    })
    .select("id")
    .single();
  if (insErr) return writeError(res, "products.duplicate", insErr);

  const images = ((src.images ?? []) as { url: string; alt: string | null; sort_order: number }[]).map((i) => ({
    product_id: copy.id,
    url: i.url,
    storage_path: null,
    alt: i.alt,
    sort_order: i.sort_order,
  }));
  if (images.length) await supabase.from("product_images").insert(images);

  const { data: full } = await supabase.from("products").select(SELECT).eq("id", copy.id).maybeSingle();
  res.status(201).json(full);
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
  if (error) return writeError(res, "products.create", error);
  res.status(201).json(data);
});

productsRouter.patch("/:id", async (req, res) => {
  if (badId(res, req.params.id)) return;
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
  if (error) return writeError(res, "products.update", error);
  if (!data) return res.status(404).json({ error: "Nie znaleziono" });
  res.json(data);
});

productsRouter.delete("/:id", async (req, res) => {
  if (badId(res, req.params.id)) return;
  const { data: imgs } = await supabase.from("product_images").select("storage_path").eq("product_id", req.params.id);
  const paths = (imgs ?? []).map((i) => i.storage_path).filter(Boolean) as string[];
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
  const { error } = await supabase.from("products").delete().eq("id", req.params.id);
  if (error) return serverError(res, "products.delete", error);
  res.json({ ok: true });
});

// Upload zdjęcia produktu → Supabase Storage + wiersz product_images.
productsRouter.post("/:id/images", upload.single("file"), async (req, res) => {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(400).json({ error: "Błędne ID produktu" });

  const file = req.file;
  if (!file) return res.status(400).json({ error: "Brak pliku lub niedozwolony format (JPG, PNG, WebP, GIF, AVIF)" });
  const alt = typeof req.body?.alt === "string" ? req.body.alt.slice(0, 255) : null;

  // Każde wgrane zdjęcie → zoptymalizowany WebP (mniejszy, szybciej się ładuje).
  // AVIF z fallbackiem na WebP serwuje już next/image na stronie.
  // limitInputPixels chroni przed decompression-bomb (mały plik → ogromna bitmapa).
  let optimized: Buffer;
  try {
    optimized = await sharp(file.buffer, { animated: true, failOn: "none", limitInputPixels: MAX_PIXELS })
      .rotate() // uwzględnij orientację EXIF, potem usuń metadane
      .resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
  } catch {
    return res.status(400).json({ error: "Nie udało się przetworzyć obrazu (uszkodzony plik lub za duży?)" });
  }

  const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, optimized, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
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
  if (badId(res, req.params.imageId)) return;
  const { data: img } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("id", req.params.imageId)
    .maybeSingle();
  if (img?.storage_path) await supabase.storage.from(BUCKET).remove([img.storage_path]);
  const { error } = await supabase.from("product_images").delete().eq("id", req.params.imageId);
  if (error) return serverError(res, "image.delete", error);
  res.json({ ok: true });
});
