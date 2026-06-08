import type { Request, Response } from "express";
import type Stripe from "stripe";
import { stripe } from "../lib/stripe.js";
import { supabase } from "../lib/supabase.js";
import { sendPushToAll } from "../lib/push.js";
import { sendOrderConfirmation } from "../lib/email.js";
import { zloty } from "../lib/util.js";

// Webhook Stripe - POTWIERDZA płatność po stronie serwera (nie ufamy klientowi).
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

  // Idempotencja - wstawiamy znacznik jako blokadę przed równoległym/powtórnym przetwarzaniem.
  const { error: dupErr } = await supabase.from("stripe_events").insert({ id: event.id });
  if (dupErr?.code === "23505") return res.json({ received: true, duplicate: true });
  if (dupErr) {
    // Nie udało się założyć blokady idempotencji - NIE przetwarzamy bez niej. Inaczej
    // ponowienie tego samego zdarzenia przez Stripe mogłoby zdublować zwrot/restock.
    // Zwracamy 5xx -> Stripe ponowi dostarczenie, gdy baza wróci do normy.
    console.error("[stripe.webhook] stripe_events insert - przerywam, Stripe ponowi", dupErr);
    return res.status(500).send("idempotency lock unavailable");
  }

  // Wspólna logika potwierdzenia płatności (Checkout Session i PaymentIntent).
  const confirmPaid = async (orderId: string | null, amount: number | null, currency: string | null, ref: string) => {
    if (!orderId) return;
    const { data: ord, error: ordErr } = await supabase
      .from("orders")
      .select("id, number, total_grosze, payment_status")
      .eq("id", orderId)
      .maybeSingle();
    if (ordErr) throw ordErr;
    if (!ord) {
      console.warn(`[stripe.webhook] zamówienie ${orderId} nie istnieje - pomijam`);
      return;
    }
    // Obrona w głąb: kwota i waluta muszą zgadzać się z zamówieniem.
    if (amount != null && amount !== ord.total_grosze) {
      console.error(`[stripe.webhook] niezgodna kwota: ${amount} ≠ zamówienie ${ord.total_grosze}`);
      return;
    }
    if (currency && currency.toLowerCase() !== "pln") {
      console.error(`[stripe.webhook] niezgodna waluta: ${currency}`);
      return;
    }
    const alreadyPaid = ord.payment_status === "paid";
    const { error: e1 } = await supabase
      .from("orders")
      .update({ payment_status: "paid", payment_provider: "stripe", payment_ref: ref })
      .eq("id", orderId);
    if (e1) throw e1;
    const { error: e2 } = await supabase.from("orders").update({ status: "paid" }).eq("id", orderId).eq("status", "pending");
    if (e2) throw e2;
    if (!alreadyPaid) {
      void sendPushToAll({ title: "🛒 Opłacone zamówienie", body: `${ord.number} - ${zloty(ord.total_grosze)}`, url: "/#orders" });
      void sendOrderConfirmation(orderId);
    }
  };

  const markPaid = async (s: Stripe.Checkout.Session) => {
    const orderId = s.metadata?.order_id || (s.client_reference_id ?? null);
    const ref = typeof s.payment_intent === "string" ? s.payment_intent : s.id;
    await confirmPaid(orderId, s.amount_total, s.currency, ref);
  };

  const markPaidByPI = async (pi: Stripe.PaymentIntent) => {
    await confirmPaid(pi.metadata?.order_id ?? null, pi.amount, pi.currency, pi.id);
  };

  const release = async (s: Stripe.Checkout.Session) => {
    const orderId = s.metadata?.order_id || (s.client_reference_id ?? null);
    if (!orderId) return;
    const { error } = await supabase.rpc("release_order", { p_order: orderId });
    if (error) throw error;
  };

  // Zwrot / chargeback OPŁACONEGO zamówienia → 'refunded' + przywrócenie stanu i promocji.
  // Dopasowanie po payment_ref = payment_intent (ustawiane w markPaid).
  const refundByPaymentIntent = async (pi: string | null) => {
    if (!pi) return;
    const { data: ord } = await supabase.from("orders").select("id").eq("payment_ref", pi).maybeSingle();
    if (!ord) return;
    const { error } = await supabase.rpc("refund_order", { p_order: ord.id });
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
      case "payment_intent.succeeded":
        // Payment Element (płatność na naszej stronie)
        await markPaidByPI(event.data.object as Stripe.PaymentIntent);
        break;
      case "charge.refunded": {
        const ch = event.data.object as Stripe.Charge;
        const pi = typeof ch.payment_intent === "string" ? ch.payment_intent : ch.payment_intent?.id ?? null;
        await refundByPaymentIntent(pi);
        break;
      }
      case "charge.dispute.created": {
        const dp = event.data.object as Stripe.Dispute;
        const pi = typeof dp.payment_intent === "string" ? dp.payment_intent : null;
        await refundByPaymentIntent(pi);
        break;
      }
    }
  } catch (err) {
    // Cofnij znacznik idempotencji → Stripe ponowi dostarczenie (backoff).
    console.error("[stripe.webhook] błąd obsługi - ponowienie", err);
    await supabase.from("stripe_events").delete().eq("id", event.id);
    return res.status(500).send("processing failed");
  }

  res.json({ received: true });
}
