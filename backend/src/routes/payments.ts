import type { Request, Response } from "express";
import type Stripe from "stripe";
import { stripe } from "../lib/stripe.js";
import { supabase } from "../lib/supabase.js";
import { sendPushToAll } from "../lib/push.js";
import { zloty } from "../lib/util.js";

// Webhook Stripe — POTWIERDZA płatność po stronie serwera (nie ufamy klientowi).
// Wymaga surowego body (express.raw) do weryfikacji podpisu.
export async function stripeWebhook(req: Request, res: Response) {
  if (!stripe) return res.status(503).end();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers["stripe-signature"];
  if (!secret || !sig) return res.status(400).send("missing signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, secret);
  } catch (err) {
    console.error("[stripe.webhook] zły podpis", err);
    return res.status(400).send("bad signature");
  }

  // Idempotencja — wstawiamy znacznik jako blokadę przed równoległym/powtórnym przetwarzaniem.
  // Przy błędzie przetwarzania znacznik USUWAMY i zwracamy 5xx, żeby Stripe ponowił.
  const { error: dupErr } = await supabase.from("stripe_events").insert({ id: event.id });
  if (dupErr?.code === "23505") return res.json({ received: true, duplicate: true });
  if (dupErr) console.error("[stripe.webhook] stripe_events insert", dupErr); // np. brak tabeli — i tak przetwarzamy

  const markPaid = async (s: Stripe.Checkout.Session) => {
    const orderId = s.metadata?.order_id || (s.client_reference_id ?? null);
    if (!orderId) return;
    // Wczytaj zamówienie: weryfikacja kwoty + własny total do powiadomienia.
    const { data: ord, error: ordErr } = await supabase
      .from("orders")
      .select("id, number, total_grosze, payment_status")
      .eq("id", orderId)
      .maybeSingle();
    if (ordErr) throw ordErr;
    if (!ord) {
      console.warn(`[stripe.webhook] zamówienie ${orderId} nie istnieje — pomijam`);
      return; // brak zamówienia: ponawianie nic nie da
    }
    // Obrona w głąb: kwota sesji musi zgadzać się z zamówieniem (sesję tworzymy serwerowo).
    if (s.amount_total != null && s.amount_total !== ord.total_grosze) {
      console.error(`[stripe.webhook] niezgodna kwota: sesja ${s.amount_total} ≠ zamówienie ${ord.total_grosze}`);
      return; // nie oznaczamy jako opłacone przy rozjeździe kwot
    }
    const alreadyPaid = ord.payment_status === "paid";
    const ref = typeof s.payment_intent === "string" ? s.payment_intent : s.id;
    const { error: e1 } = await supabase
      .from("orders")
      .update({ payment_status: "paid", payment_provider: "stripe", payment_ref: ref })
      .eq("id", orderId);
    if (e1) throw e1;
    // Realizacja: 'pending' → 'paid' (nie cofamy packed/shipped).
    const { error: e2 } = await supabase.from("orders").update({ status: "paid" }).eq("id", orderId).eq("status", "pending");
    if (e2) throw e2;
    // 🔔 Push tylko przy realnym przejściu na opłacone (własny total, nie z sesji).
    if (!alreadyPaid) {
      void sendPushToAll({
        title: "🛒 Opłacone zamówienie",
        body: `${ord.number} — ${zloty(ord.total_grosze)}`,
        url: "/#orders",
      });
    }
  };

  const release = async (s: Stripe.Checkout.Session) => {
    const orderId = s.metadata?.order_id || (s.client_reference_id ?? null);
    if (!orderId) return;
    const { error } = await supabase.rpc("release_order", { p_order: orderId });
    if (error) throw error;
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.payment_status === "paid") await markPaid(s);
        break;
      }
      case "checkout.session.async_payment_succeeded":
        await markPaid(event.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired":
        await release(event.data.object as Stripe.Checkout.Session);
        break;
    }
  } catch (err) {
    // Cofnij znacznik idempotencji → Stripe ponowi dostarczenie (backoff).
    console.error("[stripe.webhook] błąd obsługi — ponowienie", err);
    await supabase.from("stripe_events").delete().eq("id", event.id);
    return res.status(500).send("processing failed");
  }

  res.json({ received: true });
}
