import { Router } from "express";
import { z } from "zod";
import { supabase } from "../../lib/supabase.js";
import { badId, parseBody, serverError } from "../../lib/util.js";
import { createShipment, fetchLabel, getShipment, inpostConfigured, type Receiver } from "../../lib/inpost.js";

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

ordersRouter.get("/", async (req, res) => {
  const raw = typeof req.query.status === "string" ? req.query.status : null;
  const status = raw && STATUSES.has(raw) ? raw : null;
  let q = supabase.from("orders").select(SELECT).order("created_at", { ascending: false }).limit(500);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return serverError(res, "orders.list", error);
  res.json(data ?? []);
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
  const { data, error } = await supabase.from("orders").update(body).eq("id", req.params.id).select(SELECT).maybeSingle();
  if (error) return serverError(res, "orders.update", error);
  if (!data) return res.status(404).json({ error: "Nie znaleziono" });
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
  if (o.shipping_method === "pickup") return res.status(400).json({ error: "Odbiór osobisty — etykieta niepotrzebna" });

  try {
    // Jeśli przesyłka już istnieje — nie twórz duplikatu, tylko odśwież status.
    if (o.shipping_ref) {
      const s = await getShipment(o.shipping_ref);
      if (s) {
        await supabase.from("orders").update({ tracking_number: s.tracking_number }).eq("id", o.id);
        return res.json({ shipment_id: s.id, tracking_number: s.tracking_number, status: s.status, reused: true });
      }
    }
    const method = o.shipping_method === "inpost_courier" ? "courier" : "locker";
    if (method === "locker" && !o.parcel_locker) {
      return res.status(400).json({ error: "Brak wybranego paczkomatu w zamówieniu" });
    }
    const shipment = await createShipment({
      method,
      receiver: receiverFromOrder(o as never),
      lockerCode: o.parcel_locker,
      reference: o.number,
    });
    // Zapis tylko gdy shipping_ref nadal puste — chroni przed wyścigiem (podwójne kliknięcie).
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

// Pobierz etykietę PDF (przez backend — z autoryzacją, dane adresowe nie są publiczne).
ordersRouter.get("/:id/label-file", async (req, res) => {
  if (badId(res, req.params.id)) return;
  if (!inpostConfigured()) return res.status(501).json({ error: "InPost nie skonfigurowany" });
  const { data: o, error } = await supabase.from("orders").select("shipping_ref").eq("id", req.params.id).maybeSingle();
  if (error) return serverError(res, "orders.labelfile.fetch", error);
  if (!o?.shipping_ref) return res.status(404).json({ error: "Brak przesyłki — najpierw wygeneruj etykietę" });
  try {
    const pdf = await fetchLabel(o.shipping_ref);
    if (!pdf) return res.status(409).json({ error: "Etykieta jeszcze nie gotowa — spróbuj za chwilę" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="etykieta-${req.params.id}.pdf"`);
    res.send(pdf);
  } catch (err) {
    return serverError(res, "orders.labelfile.get", err);
  }
});
