import { Router } from "express";
import { supabase } from "../../lib/supabase.js";
import { badId, serverError } from "../../lib/util.js";

export const messagesRouter = Router();

// Wiadomości z formularza kontaktowego (do skrzynki w panelu).
messagesRouter.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, subject, message, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) return serverError(res, "messages.list", error);
  res.json(data ?? []);
});

messagesRouter.delete("/:id", async (req, res) => {
  if (badId(res, req.params.id)) return;
  const { error } = await supabase.from("contact_messages").delete().eq("id", req.params.id);
  if (error) return serverError(res, "messages.delete", error);
  res.json({ ok: true });
});
