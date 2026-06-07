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

  // Idempotencja — to samo zdarzenie (Stripe dostarcza „at least once") obsługujemy raz.
  const { error: dupErr } = await supabase.from("stripe_events").insert({ id: event.id });
  if (dupErr?.code === "23505") return res.json({ received: true, duplicate: true });

  try {
    const markPaid = async (s: Stripe.Checkout.Session) => {
      const orderId = s.metadata?.order_id || (s.client_reference_id ?? null);
      if (!orderId) return;
      // Płatność — zawsze (idempotentne).
      const { data: updated } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          payment_provider: "stripe",
          payment_ref: typeof s.payment_intent === "string" ? s.payment_intent : s.id,
        })
        .eq("id", orderId)
        .select("id");
      if (!updated?.length) {
        console.warn(`[stripe.webhook] zamówienie ${orderId} nie istnieje`);
        return;
      }
      // Realizacja — podnosimy do 'paid' tylko gdy nadal 'pending' (nie cofamy packed/shipped).
      await supabase.from("orders").update({ status: "paid" }).eq("id", orderId).eq("status", "pending");
      // 🔔 Powiadomienie push do właścicieli — tylko po realnym opłaceniu.
      const number = s.metadata?.number ?? "";
      void sendPushToAll({
        title: "🛒 Opłacone zamówienie",
        body: `${number} — ${zloty(s.amount_total ?? 0)}`.trim(),
        url: "/#orders",
      });
    };

    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.payment_status === "paid") await markPaid(s);
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        await markPaid(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        // Porzucona/odrzucona płatność → zwrot stanu magazynowego i promocji.
        const s = event.data.object as Stripe.Checkout.Session;
        const orderId = s.metadata?.order_id || (s.client_reference_id ?? null);
        if (orderId) await supabase.rpc("release_order", { p_order: orderId });
        break;
      }
    }
  } catch (err) {
    console.error("[stripe.webhook] błąd obsługi", err);
    // 200 i tak — Stripe nie ma czego ponawiać, błąd jest po naszej stronie i jest zalogowany
  }

  res.json({ received: true });
}
