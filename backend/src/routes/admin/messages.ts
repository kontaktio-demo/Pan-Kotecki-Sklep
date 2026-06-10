import { Router } from "express";
import { supabase } from "../../lib/supabase.js";
import { badId, serverError } from "../../lib/util.js";

export const messagesRouter = Router();

// Wiadomości z formularza kontaktowego (do skrzynki w panelu).
// Paginacja opt-in (limit/offset) - bez parametrów stara goła tablica.
messagesRouter.get("/", async (req, res) => {
  const paged = req.query.limit !== undefined || req.query.offset !== undefined;
  const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
  const offset = Math.max(0, Number(req.query.offset) || 0);

  let q = supabase
    .from("contact_messages")
    .select("id, name, email, subject, message, created_at", paged ? { count: "exact" } : undefined)
    .order("created_at", { ascending: false });
  q = paged ? q.range(offset, offset + limit - 1) : q.limit(1000);

  const { data, error, count } = await q;
  if (error) return serverError(res, "messages.list", error);
  if (paged) return res.json({ items: data ?? [], total: count ?? 0 });
  res.json(data ?? []);
});

messagesRouter.delete("/:id", async (req, res) => {
  if (badId(res, req.params.id)) return;
  const { error } = await supabase.from("contact_messages").delete().eq("id", req.params.id);
  if (error) return serverError(res, "messages.delete", error);
  res.json({ ok: true });
});
