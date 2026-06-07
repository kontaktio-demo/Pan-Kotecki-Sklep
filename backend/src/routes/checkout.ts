import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { orderNumber, parseBody, serverError, zloty } from "../lib/util.js";
import { stripe, siteUrl } from "../lib/stripe.js";
import { sendPushToAll } from "../lib/push.js";
import { withCustomer, type CustomerRequest } from "../lib/customerAuth.js";

export const checkoutRouter = Router();

// Gość domyślnie. Jeśli klient jest zalogowany (token Supabase), wiążemy
// zamówienie z jego kontem — bez wymuszania logowania.
checkoutRouter.use(withCustomer);

const SHIPPING_GROSZE: Record<string, number> = {
  inpost_locker: 1199,
  inpost_courier: 1499,
  pickup: 0,
};

const schema = z
  .object({
    items: z.array(z.object({ slug: z.string().min(1).max(100), qty: z.number().int().min(1).max(99) })).min(1).max(50),
    email: z.string().email(),
    phone: z.string().max(40).optional(),
    name: z.string().max(120).optional(),
    shipping_method: z.enum(["inpost_locker", "inpost_courier", "pickup"]).default("inpost_locker"),
    shipping_address: z.record(z.string(), z.unknown()).optional(),
    parcel_locker: z.string().max(60).optional(),
    promo_code: z.string().max(40).optional(),
  })
  // Cel dostawy musi pasować do metody — żeby nie powstało opłacone, niewysyłalne zamówienie.
  .superRefine((b, ctx) => {
    if (b.shipping_method === "inpost_locker" && !b.parcel_locker?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["parcel_locker"], message: "Wybierz paczkomat" });
    }
    if (b.shipping_method === "inpost_courier") {
      const a = (b.shipping_address ?? {}) as Record<string, unknown>;
      const missing = ["street", "building_number", "city", "post_code"].some((k) => !String(a[k] ?? "").trim());
      if (missing) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["shipping_address"], message: "Uzupełnij adres dostawy" });
    }
  });

checkoutRouter.post("/", async (req: CustomerRequest, res) => {
  const body = parseBody(schema, req.body, res);
  if (!body) return;

  // scal duplikaty slugów (np. ten sam produkt dodany dwa razy)
  const merged = new Map<string, number>();
  for (const it of body.items) merged.set(it.slug, (merged.get(it.slug) ?? 0) + it.qty);
  const wanted = [...merged.entries()].map(([slug, qty]) => ({ slug, qty }));

  // 1) Ceny ZAWSZE z bazy — nigdy z klienta.
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, slug, name, price_grosze, sale_price_grosze, active, in_stock, stock_qty, images:product_images(url, sort_order)")
    .in("slug", wanted.map((w) => w.slug))
    .eq("active", true);
  if (prodErr) return serverError(res, "checkout.products", prodErr);

  const bySlug = new Map((products ?? []).map((p) => [p.slug, p]));
  const lineItems: { product_id: string; slug: string; name: string; price_grosze: number; qty: number; image_url: string | null }[] = [];
  for (const it of wanted) {
    const p = bySlug.get(it.slug);
    if (!p) return res.status(400).json({ error: `Produkt niedostępny: ${it.slug}` });
    if (!p.in_stock || (p.stock_qty != null && p.stock_qty < it.qty)) {
      return res.status(400).json({ error: `Brak na stanie: ${p.name}` });
    }
    const unit = p.sale_price_grosze ?? p.price_grosze;
    const image = (p.images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
    lineItems.push({ product_id: p.id, slug: p.slug, name: p.name, price_grosze: unit, qty: it.qty, image_url: image });
  }

  const totalQty = lineItems.reduce((s, i) => s + i.qty, 0);
  if (totalQty > 500) return res.status(400).json({ error: "Zamówienie zbyt duże" });

  const subtotal = lineItems.reduce((s, i) => s + i.price_grosze * i.qty, 0);

  // 2) Promocja (walidacja po stronie serwera)
  let discount = 0;
  let appliedPromo: { id: string; code: string } | null = null;
  if (body.promo_code) {
    const { data: promo } = await supabase
      .from("promotions")
      .select("*")
      .eq("code", body.promo_code.toUpperCase())
      .maybeSingle();
    const now = Date.now();
    const valid =
      promo &&
      promo.active &&
      subtotal >= (promo.min_order_grosze ?? 0) &&
      (!promo.starts_at || new Date(promo.starts_at).getTime() <= now) &&
      (!promo.ends_at || new Date(promo.ends_at).getTime() >= now) &&
      (promo.usage_limit == null || promo.used_count < promo.usage_limit);
    if (valid) {
      discount =
        promo.kind === "percent"
          ? Math.floor((subtotal * Math.min(Math.max(promo.value, 0), 100)) / 100)
          : Math.max(promo.value, 0);
      discount = Math.max(0, Math.min(discount, subtotal));
      appliedPromo = { id: promo.id, code: promo.code };
    }
  }

  // 3) Dostawa (darmowa od progu — liczona od wartości produktów, przed rabatem)
  const { data: storeSetting } = await supabase.from("settings").select("value").eq("key", "store").maybeSingle();
  const rawThreshold = Number((storeSetting?.value as { free_shipping_grosze?: number })?.free_shipping_grosze);
  const freeThreshold = Number.isFinite(rawThreshold) && rawThreshold >= 0 ? rawThreshold : 14900;
  const method = body.shipping_method ?? "inpost_locker";
  let shipping = SHIPPING_GROSZE[method] ?? 0;
  if (method !== "pickup" && subtotal >= freeThreshold) shipping = 0;

  const total = subtotal - discount + shipping;
  if (total < 0) return res.status(400).json({ error: "Błąd wyceny zamówienia" });

  // 4) Klient (znajdź lub utwórz)
  const email = body.email.toLowerCase();
  let customerId: string | null = null;
  const { data: existing } = await supabase.from("customers").select("id").eq("email", email).maybeSingle();
  if (existing) customerId = existing.id;
  else {
    const { data: created } = await supabase
      .from("customers")
      .insert({ email, name: body.name ?? null, phone: body.phone ?? null })
      .select("id")
      .single();
    customerId = created?.id ?? null;
  }

  // 5) Zamówienie + pozycje + ATOMOWY dekrement stanu i licznik promocji.
  //    Wszystko w jednej transakcji Postgres (RPC) — brak oversell i wyścigów.
  const { data: result, error: rpcErr } = await supabase.rpc("create_order", {
    p: {
      number: orderNumber(),
      customer_id: customerId,
      user_id: req.customer?.id ?? null,
      email,
      phone: body.phone ?? null,
      subtotal_grosze: subtotal,
      discount_grosze: discount,
      shipping_grosze: shipping,
      total_grosze: total,
      currency: "PLN",
      promo_code: appliedPromo?.code ?? null,
      promo_id: appliedPromo?.id ?? null,
      shipping_method: method,
      shipping_address: body.shipping_address ?? null,
      parcel_locker: body.parcel_locker ?? null,
      items: lineItems,
    },
  });

  if (rpcErr) {
    const msg = rpcErr.message ?? "";
    if (msg.startsWith("OUT_OF_STOCK:")) {
      const slug = msg.slice("OUT_OF_STOCK:".length).trim();
      const name = bySlug.get(slug)?.name ?? slug;
      return res.status(409).json({ error: `Brak na stanie: ${name}` });
    }
    if (msg.includes("PROMO_EXHAUSTED")) {
      return res.status(409).json({ error: "Kod rabatowy został już wykorzystany" });
    }
    return serverError(res, "checkout.create_order", rpcErr);
  }

  const order = result as { order_id: string; number: string };

  // 6) Płatność.
  let checkoutUrl: string | null = null;
  const base = siteUrl();
  if (total === 0) {
    // Darmowe zamówienie (np. 100% rabat + odbiór) — od razu opłacone, bez Stripe.
    await supabase.from("orders").update({ status: "paid", payment_status: "paid" }).eq("id", order.order_id);
    void sendPushToAll({ title: "🛒 Opłacone zamówienie", body: `${order.number} — ${zloty(0)}`, url: "/#orders" });
  } else if (stripe && base) {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card", "blik", "p24"],
        customer_email: email,
        client_reference_id: order.order_id,
        metadata: { order_id: order.order_id, number: order.number },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "pln",
              unit_amount: total,
              product_data: { name: `Zamówienie ${order.number} — Pan Kotecki` },
            },
          },
        ],
        success_url: `${base}/kasa/dziekujemy?order=${encodeURIComponent(order.number)}`,
        cancel_url: `${base}/kasa?anulowano=1`,
      });
      checkoutUrl = session.url;
      await supabase
        .from("orders")
        .update({ payment_provider: "stripe", payment_ref: session.id })
        .eq("id", order.order_id);
    } catch (err) {
      console.error("[checkout.stripe]", err);
      // Stripe włączony, ale sesja się nie utworzyła → zwolnij stan i zgłoś błąd
      // (nie wysyłamy klienta na „dziękujemy" bez płatności).
      await supabase.rpc("release_order", { p_order: order.order_id });
      return res.status(502).json({ error: "Płatność chwilowo niedostępna. Spróbuj ponownie za chwilę." });
    }
  }

  res.status(201).json({
    orderId: order.order_id,
    number: order.number,
    subtotal: subtotal / 100,
    discount: discount / 100,
    shipping: shipping / 100,
    total: total / 100,
    totalGrosze: total,
    checkoutUrl,
  });
});
