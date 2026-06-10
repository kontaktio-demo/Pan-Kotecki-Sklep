import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { parseBody, serverError } from "../lib/util.js";
import { withCustomer, type CustomerRequest } from "../lib/customerAuth.js";
import { sendPushToAll } from "../lib/push.js";

// Opinie o produktach - TYLKO zweryfikowany zakup (konto albo numer zamówienia
// + e-mail). Nowe opinie czekają na moderację w panelu (status: pending).
export const reviewsRouter = Router();

const PAGE_SIZE = 10;

// Publiczna lista zatwierdzonych opinii + podsumowanie (średnia, rozkład gwiazdek).
reviewsRouter.get("/products/:slug/reviews", async (req, res) => {
  const slug = String(req.params.slug).slice(0, 80);
  const page = Math.max(1, Math.min(500, Number(req.query.strona) || 1));

  const { data: product } = await supabase
    .from("products")
    .select("id, rating_avg, rating_count")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (!product) return res.status(404).json({ error: "Nie znaleziono produktu" });

  const from = (page - 1) * PAGE_SIZE;
  const [{ data: rows, error }, { data: allRatings }] = await Promise.all([
    supabase
      .from("product_reviews")
      .select("id, author_name, rating, body, verified, created_at")
      .eq("product_id", product.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1),
    supabase.from("product_reviews").select("rating").eq("product_id", product.id).eq("status", "approved"),
  ]);
  if (error) return serverError(res, "reviews.list", error);

  const stars: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of allRatings ?? []) stars[r.rating as number] = (stars[r.rating as number] ?? 0) + 1;
  const count = product.rating_count ?? 0;

  res.set("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=600");
  res.json({
    summary: {
      avg: product.rating_avg != null ? Number(product.rating_avg) : null,
      count,
      stars,
    },
    reviews: (rows ?? []).map((r) => ({
      id: r.id,
      author: r.author_name,
      rating: r.rating,
      body: r.body,
      verified: r.verified,
      createdAt: r.created_at,
    })),
    page,
    pageCount: Math.max(1, Math.ceil(count / PAGE_SIZE)),
  });
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(10).max(2000),
  author_name: z.string().min(2).max(60),
  // ścieżka gościa: weryfikacja po numerze zamówienia + e-mailu
  order_number: z.string().max(40).optional(),
  email: z.string().email().max(160).optional(),
});

const postLimiter = rateLimit({ windowMs: 60 * 60_000, max: 5, standardHeaders: true, legacyHeaders: false });

reviewsRouter.post("/products/:slug/reviews", postLimiter, withCustomer, async (req: CustomerRequest, res) => {
  const slug = String(req.params.slug).slice(0, 80);
  const body = parseBody(reviewSchema, req.body, res);
  if (!body) return;

  const { data: product } = await supabase
    .from("products")
    .select("id, name")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (!product) return res.status(404).json({ error: "Nie znaleziono produktu" });

  // Weryfikacja zakupu: szukamy OPŁACONEGO zamówienia zawierającego ten produkt.
  let orderQuery = supabase
    .from("orders")
    .select("id, user_id, email, items:order_items(slug)")
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false })
    .limit(50);

  if (req.customer) {
    orderQuery = orderQuery.eq("user_id", req.customer.id);
  } else if (body.order_number && body.email) {
    orderQuery = orderQuery.eq("number", body.order_number.trim().toUpperCase()).eq("email", body.email.trim().toLowerCase());
  } else {
    return res.status(401).json({
      error: "Aby dodać opinię, zaloguj się albo podaj numer zamówienia i e-mail użyty przy zakupie.",
    });
  }

  const { data: orders, error: ordErr } = await orderQuery;
  if (ordErr) return serverError(res, "reviews.verify", ordErr);

  const match = (orders ?? []).find((o) =>
    ((o.items ?? []) as { slug: string | null }[]).some((i) => i.slug === slug),
  );
  if (!match) {
    return res.status(403).json({
      error: "Opinie mogą dodawać tylko osoby, które kupiły ten produkt (opłacone zamówienie).",
    });
  }

  const { error: insErr } = await supabase.from("product_reviews").insert({
    product_id: product.id,
    order_id: match.id,
    user_id: req.customer?.id ?? match.user_id ?? null,
    author_name: body.author_name.trim(),
    rating: body.rating,
    body: body.body.trim(),
    status: "pending",
    verified: true,
  });
  if (insErr) {
    if (insErr.code === "23505") {
      return res.status(409).json({ error: "Ten zakup ma już opinię o tym produkcie." });
    }
    return serverError(res, "reviews.insert", insErr);
  }

  // Daj znać właścicielowi w panelu (nie blokuje odpowiedzi).
  void sendPushToAll({
    title: "Nowa opinia do moderacji",
    body: `${product.name}: ocena ${body.rating}/5 od ${body.author_name.trim()}`,
    tag: "review",
  });

  res.status(201).json({ ok: true, message: "Dziękujemy! Opinia pojawi się po zatwierdzeniu." });
});
