import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { parseBody, serverError, badId } from "../lib/util.js";
import { requireCustomer, type CustomerRequest } from "../lib/customerAuth.js";

export const accountRouter = Router();

// Wszystkie trasy wymagają zalogowanego klienta (token Supabase).
accountRouter.use(requireCustomer);

// ── Profil ───────────────────────────────────────────────────
const profileSchema = z.object({
  full_name: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  marketing_consent: z.boolean().optional(),
});

// Zwraca profil; tworzy pusty przy pierwszym wejściu (lazy).
accountRouter.get("/me", async (req: CustomerRequest, res) => {
  const { id, email } = req.customer!;
  const { data, error } = await supabase
    .from("account_profiles")
    .select("full_name, phone, marketing_consent")
    .eq("user_id", id)
    .maybeSingle();
  if (error) return serverError(res, "account.me", error);

  if (!data) {
    await supabase.from("account_profiles").insert({ user_id: id }).select("user_id").maybeSingle();
    return res.json({ email, full_name: "", phone: "", marketing_consent: false });
  }
  res.json({
    email,
    full_name: data.full_name ?? "",
    phone: data.phone ?? "",
    marketing_consent: !!data.marketing_consent,
  });
});

accountRouter.put("/me", async (req: CustomerRequest, res) => {
  const body = parseBody(profileSchema, req.body, res);
  if (!body) return;
  const { id, email } = req.customer!;
  const patch: Record<string, unknown> = { user_id: id };
  if (body.full_name !== undefined) patch.full_name = body.full_name.trim() || null;
  if (body.phone !== undefined) patch.phone = body.phone.trim() || null;
  if (body.marketing_consent !== undefined) patch.marketing_consent = body.marketing_consent;

  const { error } = await supabase.from("account_profiles").upsert(patch, { onConflict: "user_id" });
  if (error) return serverError(res, "account.me.put", error);
  res.json({ ok: true, email });
});

// RODO — trwałe usunięcie konta. Zamówienia zostają (księgowość), ale odpinamy je od konta.
accountRouter.delete("/me", async (req: CustomerRequest, res) => {
  const { id } = req.customer!;
  await supabase.from("account_addresses").delete().eq("user_id", id);
  await supabase.from("account_profiles").delete().eq("user_id", id);
  await supabase.from("orders").update({ user_id: null }).eq("user_id", id);
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return serverError(res, "account.delete", error);
  res.json({ ok: true });
});

// ── Zamówienia ───────────────────────────────────────────────
const ORDER_SELECT =
  "number, status, payment_status, total_grosze, currency, created_at, shipping_method, tracking_number, items:order_items(name, qty, slug, price_grosze, image_url)";

type OrderRow = {
  number: string;
  status: string;
  payment_status: string;
  total_grosze: number;
  currency: string;
  created_at: string;
  shipping_method: string | null;
  tracking_number: string | null;
  items: { name: string; qty: number; slug: string | null; price_grosze: number; image_url: string | null }[] | null;
};

function mapOrder(o: OrderRow) {
  const items = (o.items ?? []).map((i) => ({
    name: i.name,
    qty: i.qty,
    slug: i.slug,
    price: i.price_grosze / 100,
    image: i.image_url,
  }));
  return {
    number: o.number,
    status: o.status,
    paymentStatus: o.payment_status,
    total: o.total_grosze / 100,
    currency: o.currency,
    createdAt: o.created_at,
    shippingMethod: o.shipping_method,
    trackingNumber: o.tracking_number,
    itemCount: items.reduce((s, i) => s + i.qty, 0),
    items,
  };
}

// Lista zamówień klienta. Najpierw „przejmujemy" dawne zamówienia gościa
// złożone na ten sam (zweryfikowany logowaniem) e-mail.
accountRouter.get("/orders", async (req: CustomerRequest, res) => {
  const { id, email } = req.customer!;
  if (email) {
    await supabase.from("orders").update({ user_id: id }).is("user_id", null).eq("email", email);
  }
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return serverError(res, "account.orders", error);
  res.json(((data ?? []) as unknown as OrderRow[]).map(mapOrder));
});

const ORDER_DETAIL_SELECT =
  "number, status, payment_status, subtotal_grosze, discount_grosze, shipping_grosze, total_grosze, currency, created_at, shipping_method, parcel_locker, shipping_address, tracking_number, email, user_id, promo_code, items:order_items(name, qty, slug, price_grosze, image_url)";

accountRouter.get("/orders/:number", async (req: CustomerRequest, res) => {
  const { id, email } = req.customer!;
  const number = String(req.params.number).slice(0, 40);
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_DETAIL_SELECT)
    .eq("number", number)
    .maybeSingle();
  if (error) return serverError(res, "account.order", error);
  if (!data) return res.status(404).json({ error: "Nie znaleziono zamówienia" });

  // Właścicielstwo: po koncie albo po zweryfikowanym e-mailu.
  const owns = data.user_id === id || (email && (data.email ?? "").toLowerCase() === email);
  if (!owns) return res.status(404).json({ error: "Nie znaleziono zamówienia" });

  const o = data as unknown as OrderRow & {
    subtotal_grosze: number; discount_grosze: number; shipping_grosze: number;
    parcel_locker: string | null; shipping_address: Record<string, unknown> | null; promo_code: string | null;
  };
  res.json({
    ...mapOrder(o),
    subtotal: o.subtotal_grosze / 100,
    discount: o.discount_grosze / 100,
    shipping: o.shipping_grosze / 100,
    parcelLocker: o.parcel_locker,
    shippingAddress: o.shipping_address,
    promoCode: o.promo_code,
  });
});

// ── Książka adresowa ─────────────────────────────────────────
const ADDRESS_SELECT =
  "id, label, first_name, last_name, street, building, apartment, postal_code, city, phone, is_default, created_at";

const addressSchema = z.object({
  label: z.string().max(40).optional(),
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  street: z.string().min(1).max(120),
  building: z.string().min(1).max(20),
  apartment: z.string().max(20).optional(),
  postal_code: z.string().min(1).max(12),
  city: z.string().min(1).max(80),
  phone: z.string().max(40).optional(),
  is_default: z.boolean().optional(),
});

accountRouter.get("/addresses", async (req: CustomerRequest, res) => {
  const { id } = req.customer!;
  const { data, error } = await supabase
    .from("account_addresses")
    .select(ADDRESS_SELECT)
    .eq("user_id", id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return serverError(res, "account.addresses", error);
  res.json(data ?? []);
});

accountRouter.post("/addresses", async (req: CustomerRequest, res) => {
  const body = parseBody(addressSchema, req.body, res);
  if (!body) return;
  const { id } = req.customer!;

  if (body.is_default) {
    await supabase.from("account_addresses").update({ is_default: false }).eq("user_id", id);
  }
  // Pierwszy adres staje się domyślnym automatycznie.
  const { count } = await supabase.from("account_addresses").select("id", { count: "exact", head: true }).eq("user_id", id);
  const isDefault = body.is_default || (count ?? 0) === 0;

  const { data, error } = await supabase
    .from("account_addresses")
    .insert({
      user_id: id,
      label: body.label ?? null,
      first_name: body.first_name,
      last_name: body.last_name,
      street: body.street,
      building: body.building,
      apartment: body.apartment ?? null,
      postal_code: body.postal_code,
      city: body.city,
      phone: body.phone ?? null,
      is_default: isDefault,
    })
    .select(ADDRESS_SELECT)
    .single();
  if (error) return serverError(res, "account.addresses.post", error);
  res.status(201).json(data);
});

accountRouter.put("/addresses/:id", async (req: CustomerRequest, res) => {
  if (badId(res, req.params.id)) return;
  const body = parseBody(addressSchema, req.body, res);
  if (!body) return;
  const { id } = req.customer!;

  if (body.is_default) {
    await supabase.from("account_addresses").update({ is_default: false }).eq("user_id", id);
  }
  const { data, error } = await supabase
    .from("account_addresses")
    .update({
      label: body.label ?? null,
      first_name: body.first_name,
      last_name: body.last_name,
      street: body.street,
      building: body.building,
      apartment: body.apartment ?? null,
      postal_code: body.postal_code,
      city: body.city,
      phone: body.phone ?? null,
      is_default: body.is_default ?? false,
    })
    .eq("id", req.params.id)
    .eq("user_id", id) // ownership
    .select(ADDRESS_SELECT)
    .maybeSingle();
  if (error) return serverError(res, "account.addresses.put", error);
  if (!data) return res.status(404).json({ error: "Nie znaleziono adresu" });
  res.json(data);
});

accountRouter.delete("/addresses/:id", async (req: CustomerRequest, res) => {
  if (badId(res, req.params.id)) return;
  const { id } = req.customer!;
  const { error } = await supabase.from("account_addresses").delete().eq("id", req.params.id).eq("user_id", id);
  if (error) return serverError(res, "account.addresses.delete", error);
  res.json({ ok: true });
});
