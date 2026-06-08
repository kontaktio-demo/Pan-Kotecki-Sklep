import { Router } from "express";
import { z } from "zod";
import { supabase } from "../../lib/supabase.js";
import { badId, parseBody, serverError } from "../../lib/util.js";
import { sendBatch, newsletterHtml } from "../../lib/email.js";
import { siteUrl } from "../../lib/stripe.js";

export const newsletterAdminRouter = Router();

// Lista subskrybentów (potwierdzeni + oczekujący).
newsletterAdminRouter.get("/subscribers", async (_req, res) => {
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, confirmed, consent_at, source, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) return serverError(res, "newsletter.subscribers", error);
  const list = data ?? [];
  res.json({
    total: list.length,
    confirmed: list.filter((s) => s.confirmed).length,
    subscribers: list,
  });
});

// Usunięcie subskrybenta (RODO / zarządzanie).
newsletterAdminRouter.delete("/subscribers/:id", async (req, res) => {
  if (badId(res, req.params.id)) return;
  const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", req.params.id);
  if (error) return serverError(res, "newsletter.subscribers.delete", error);
  res.json({ ok: true });
});

// Operator wpisuje TYLKO temat + główną treść. Style, branding i „wypisz się"
// doklejamy odgórnie. Wysyłka do POTWIERDZONYCH subskrybentów (double opt-in).
const sendSchema = z.object({
  subject: z.string().min(1).max(160),
  content: z.string().min(1).max(20000),
});

function contentToHtml(text: string): string {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc
    .split(/\n{2,}/)
    .map((par) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3c352b">${par.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

newsletterAdminRouter.post("/send", async (req, res) => {
  const body = parseBody(sendSchema, req.body, res);
  if (!body) return;

  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("email, unsub_token")
    .eq("confirmed", true);
  if (error) return serverError(res, "newsletter.send.list", error);
  const subs = data ?? [];
  if (subs.length === 0) return res.json({ sent: 0, total: 0, message: "Brak potwierdzonych subskrybentów." });

  const shop = siteUrl() || "https://pankotecki.pl";
  const inner = contentToHtml(body.content);
  const messages = subs.map((s) => ({
    to: s.email,
    subject: body.subject,
    html: newsletterHtml(inner, `${shop}/newsletter/wypisz?token=${s.unsub_token ?? ""}`),
  }));

  const sent = await sendBatch(messages);
  res.json({ sent, total: subs.length });
});
