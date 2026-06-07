import { Router } from "express";
import { supabase } from "../../lib/supabase.js";
import { serverError } from "../../lib/util.js";
import { pushEnabled, sendPushToAll, vapidPublicKey } from "../../lib/push.js";

export const pushRouter = Router();

// Klucz publiczny VAPID — aplikacja używa go do subskrypcji.
pushRouter.get("/public-key", (_req, res) => res.json({ key: vapidPublicKey() }));

// Zapis (lub odświeżenie) subskrypcji telefonu.
pushRouter.post("/subscribe", async (req, res) => {
  const sub = req.body;
  if (!sub?.endpoint || !sub?.keys) return res.status(400).json({ error: "Błędna subskrypcja" });
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ endpoint: sub.endpoint, subscription: sub }, { onConflict: "endpoint" });
  if (error) return serverError(res, "push.subscribe", error);
  res.json({ ok: true });
});

// Testowe powiadomienie (z ekranu Powiadomienia).
pushRouter.post("/test", async (_req, res) => {
  if (!pushEnabled) return res.status(501).json({ error: "Powiadomienia nie są skonfigurowane (brak kluczy VAPID na Render)" });
  await sendPushToAll({ title: "Pan Kotecki 🐾", body: "Testowe powiadomienie — działa!", url: "/#orders" });
  res.json({ ok: true });
});
