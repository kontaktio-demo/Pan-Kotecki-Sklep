import { Router } from "express";
import { z } from "zod";
import { supabase } from "../../lib/supabase.js";
import { badId, parseBody, serverError, zloty } from "../../lib/util.js";
import { createShipment, fetchLabel, getShipment, inpostConfigured, type Receiver } from "../../lib/inpost.js";
import { sendPushToAll } from "../../lib/push.js";
import { sendCsv } from "../../lib/csv.js";

export const ordersRouter = Router();

type Addr = { first_name?: string; last_name?: string; street?: string; building_number?: string; city?: string; post_code?: string };

function receiverFromOrder(o: { email: string; phone: string | null; shipping_address: Addr | null }): Receiver {
  const a = o.shipping_address ?? {};
  return {
    first_name: a.first_name ?? "Klient",
    last_name: a.last_name ?? "Sklepu",
    email: o.email,
    phone: o.phone,
    address: { street: a.street, building_number: a.building_number, city: a.city, post_code: a.post_code },
  };
}

const SELECT = "*, items:order_items(*)";
const STATUSES = new Set(["pending", "paid", "packed", "shipped", "delivered", "cancelled", "refunded"]);

// czyści frazę do bezpiecznego użycia w .or(...ilike...) PostgREST
function safeQ(input: string): string {
  return input.replace(/[^\p{L}\p{N}\s@.\-_]/gu, " ").trim().slice(0, 80);
}

function parseDate(v: unknown): string | null {
  if (typeof v !== "string" || !v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

ordersRouter.get("/", async (req, res) => {
  const raw = typeof req.query.status === "string" ? req.query.status : null;
  const status = raw && STATUSES.has(raw) ? raw : null;
  const search = typeof req.query.q === "string" ? safeQ(req.query.q) : "";
  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to);
  // Paginacja jest opt-in (parametr limit/offset) - bez parametrów zwracamy
  // jak dawniej gołą tablicę, żeby stare buildy paneli dalej działały.
  const paged = req.query.limit !== undefined || req.query.offset !== undefined;
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 50));
  const offset = Math.max(0, Number(req.query.offset) || 0);

  let q = supabase
    .from("orders")
    .select(SELECT, paged ? { count: "exact" } : undefined)
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  if (search) q = q.or(`number.ilike.%${search}%,email.ilike.%${search}%`);
  if (from) q = q.gte("created_at", from);
  if (to) q = q.lte("created_at", to);
  q = paged ? q.range(offset, offset + limit - 1) : q.limit(500);

  const { data, error, count } = await q;
  if (error) return serverError(res, "orders.list", error);
  if (paged) return res.json({ items: data ?? [], total: count ?? 0 });
  res.json(data ?? []);
});

// Eksport CSV (księgowość / analiza). Rejestrowane PRZED /:id.
ordersRouter.get("/export.csv", async (req, res) => {
  const raw = typeof req.query.status === "string" ? req.query.status : null;
  const status = raw && STATUSES.has(raw) ? raw : null;
  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to);

  let q = supabase
    .from("orders")
    .select("number, created_at, email, status, payment_status, subtotal_grosze, discount_grosze, shipping_grosze, total_grosze, promo_code, shipping_method, tracking_number")
    .order("created_at", { ascending: false })
    .limit(10000);
  if (status) q = q.eq("status", status);
  if (from) q = q.gte("created_at", from);
  if (to) q = q.lte("created_at", to);

  const { data, error } = await q;
  if (error) return serverError(res, "orders.export", error);

  sendCsv(
    res,
    "zamowienia.csv",
    ["Numer", "Data", "E-mail", "Status", "Płatność", "Wartość netto (zł)", "Rabat (zł)", "Dostawa (zł)", "Razem (zł)", "Kod", "Dostawa metodą", "Nr śledzenia"],
    (data ?? []).map((o) => [
      o.number,
      new Date(o.created_at).toLocaleString("pl-PL"),
      o.email,
      o.status,
      o.payment_status,
      (o.subtotal_grosze / 100).toFixed(2).replace(".", ","),
      (o.discount_grosze / 100).toFixed(2).replace(".", ","),
      (o.shipping_grosze / 100).toFixed(2).replace(".", ","),
      (o.total_grosze / 100).toFixed(2).replace(".", ","),
      o.promo_code ?? "",
      o.shipping_method ?? "",
      o.tracking_number ?? "",
    ]),
  );
});

// Masowa zmiana statusu (np. 12 zamówień → "shipped" jednym ruchem).
const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  status: z.enum(["pending", "paid", "packed", "shipped", "delivered", "cancelled", "refunded"]),
});
ordersRouter.patch("/bulk", async (req, res) => {
  const body = parseBody(bulkSchema, req.body, res);
  if (!body) return;
  const { data, error } = await supabase
    .from("orders")
    .update({ status: body.status })
    .in("id", body.ids)
    .select("id");
  if (error) return serverError(res, "orders.bulk", error);
  res.json({ ok: true, updated: data?.length ?? 0 });
});

ordersRouter.get("/:id", async (req, res) => {
  if (badId(res, req.params.id)) return;
  const { data, error } = await supabase.from("orders").select(SELECT).eq("id", req.params.id).maybeSingle();
  if (error) return serverError(res, "orders.get", error);
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
  if (badId(res, req.params.id)) return;
  const body = parseBody(patchSchema, req.body, res);
  if (!body) return;

  const patch: Record<string, unknown> = { ...body };
  // Czy to przejście na „opłacone"? (push tylko raz, przy zmianie)
  let wasPaid = true;
  if (body.payment_status === "paid") {
    const { data: prev } = await supabase.from("orders").select("payment_status, status").eq("id", req.params.id).maybeSingle();
    wasPaid = prev?.payment_status === "paid";
    // operator oznaczył opłacone, nie wybrał statusu, a było 'pending' → podnieś na 'paid' (jak webhook)
    if (body.status === undefined && prev?.status === "pending") patch.status = "paid";
  }

  const { data, error } = await supabase.from("orders").update(patch).eq("id", req.params.id).select(SELECT).maybeSingle();
  if (error) return serverError(res, "orders.update", error);
  if (!data) return res.status(404).json({ error: "Nie znaleziono" });

  if (body.payment_status === "paid" && !wasPaid) {
    void sendPushToAll({
      title: "🛒 Opłacone zamówienie",
      body: `${data.number} - ${zloty(data.total_grosze)}`,
      url: "/#orders",
    });
  }

  res.json(data);
});

// Wygeneruj przesyłkę InPost (paczkomat/kurier) dla zamówienia → zapis tracking + status.
ordersRouter.post("/:id/label", async (req, res) => {
  if (badId(res, req.params.id)) return;
  if (!inpostConfigured()) {
    return res.status(501).json({ error: "InPost nie skonfigurowany (ustaw INPOST_TOKEN i INPOST_ORG_ID na Render)" });
  }
  const { data: o, error } = await supabase
    .from("orders")
    .select("id, number, email, phone, shipping_method, parcel_locker, shipping_address, shipping_ref, tracking_number, status")
    .eq("id", req.params.id)
    .maybeSingle();
  if (error) return serverError(res, "orders.label.fetch", error);
  if (!o) return res.status(404).json({ error: "Nie znaleziono" });
  if (o.shipping_method === "pickup") return res.status(400).json({ error: "Odbiór osobisty - etykieta niepotrzebna" });

  try {
    // Jeśli przesyłka już istnieje - nie twórz duplikatu, tylko odśwież status.
    if (o.shipping_ref) {
      const s = await getShipment(o.shipping_ref); // rzuca przy 401/429/500; null tylko przy realnym 404
      if (s) {
        await supabase.from("orders").update({ tracking_number: s.tracking_number }).eq("id", o.id);
        return res.json({ shipment_id: s.id, tracking_number: s.tracking_number, status: s.status, reused: true });
      }
      // 404 = przesyłka usunięta/anulowana w InPost → wyczyść stary ref i utwórz nową (zamiast osierocać)
      await supabase.from("orders").update({ shipping_ref: null }).eq("id", o.id);
      o.shipping_ref = null;
    }
    const method = o.shipping_method === "inpost_courier" ? "courier" : "locker";
    if (method === "locker" && !o.parcel_locker) {
      return res.status(400).json({ error: "Brak wybranego paczkomatu w zamówieniu" });
    }
    if (method === "courier") {
      const a = (o.shipping_address ?? {}) as Addr;
      if (!a.street || !a.city || !a.post_code) {
        return res.status(400).json({ error: "Brak/niepełny adres dostawy - uzupełnij dane przed wygenerowaniem etykiety kuriera" });
      }
    }
    const shipment = await createShipment({
      method,
      receiver: receiverFromOrder(o as never),
      lockerCode: o.parcel_locker,
      reference: o.number,
    });
    // Zapis tylko gdy shipping_ref nadal puste - chroni przed wyścigiem (podwójne kliknięcie).
    const { data: saved } = await supabase
      .from("orders")
      .update({ shipping_ref: shipment.id, tracking_number: shipment.tracking_number, status: "packed" })
      .eq("id", o.id)
      .is("shipping_ref", null)
      .select("id");
    if (!saved?.length) {
      const { data: cur } = await supabase.from("orders").select("shipping_ref, tracking_number").eq("id", o.id).maybeSingle();
      return res.json({ shipment_id: cur?.shipping_ref ?? shipment.id, tracking_number: cur?.tracking_number ?? shipment.tracking_number, status: "packed", reused: true });
    }
    res.status(201).json({ shipment_id: shipment.id, tracking_number: shipment.tracking_number, status: shipment.status });
  } catch (err) {
    return serverError(res, "orders.label.create", err);
  }
});

// Pobierz etykietę PDF (przez backend - z autoryzacją, dane adresowe nie są publiczne).
ordersRouter.get("/:id/label-file", async (req, res) => {
  if (badId(res, req.params.id)) return;
  if (!inpostConfigured()) return res.status(501).json({ error: "InPost nie skonfigurowany" });
  const { data: o, error } = await supabase.from("orders").select("shipping_ref").eq("id", req.params.id).maybeSingle();
  if (error) return serverError(res, "orders.labelfile.fetch", error);
  if (!o?.shipping_ref) return res.status(404).json({ error: "Brak przesyłki - najpierw wygeneruj etykietę" });
  try {
    const pdf = await fetchLabel(o.shipping_ref);
    if (!pdf) return res.status(409).json({ error: "Etykieta jeszcze nie gotowa - spróbuj za chwilę" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="etykieta-${req.params.id}.pdf"`);
    res.send(pdf);
  } catch (err) {
    return serverError(res, "orders.labelfile.get", err);
  }
});
