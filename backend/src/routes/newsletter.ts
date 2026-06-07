import { randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { parseBody, serverError } from "../lib/util.js";
import { sendNewsletterConfirm } from "../lib/email.js";
import { verifyCaptcha } from "../lib/captcha.js";
import { siteUrl } from "../lib/stripe.js";

export const newsletterRouter = Router();

const WELCOME_CODE = process.env.NEWSLETTER_WELCOME_CODE || "KOT10";
const shopUrl = () => siteUrl() || "https://pankotecki.pl";

const schema = z.object({
  email: z.string().email().max(160),
  consent: z.boolean().optional(),
  source: z.string().max(40).optional(),
  captchaToken: z.string().max(5000).optional(),
});

function baseUrl(req: { protocol: string; get: (h: string) => string | undefined }): string {
  return `${req.protocol}://${req.get("host")}`;
}

// Zapis z DOWODEM zgody + double opt-in (mail z linkiem potwierdzającym).
newsletterRouter.post("/", async (req, res) => {
  const body = parseBody(schema, req.body, res);
  if (!body) return;
  if (body.consent === false) {
    return res.status(400).json({ error: "Do zapisu wymagana jest zgoda na newsletter." });
  }
  if (!(await verifyCaptcha(body.captchaToken))) {
    return res.status(400).json({ error: "Potwierdź, że nie jesteś robotem." });
  }
  const email = body.email.trim().toLowerCase();
  const confirmToken = randomBytes(24).toString("hex");
  const unsubToken = randomBytes(16).toString("hex");

  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email, consent: true, source: body.source ?? "web", confirm_token: confirmToken, unsub_token: unsubToken });

  if (error && error.code !== "23505") return serverError(res, "newsletter", error);

  if (error?.code === "23505") {
    // Już istnieje — jeśli niepotwierdzony, odśwież token i wyślij ponownie.
    const { data: ex } = await supabase
      .from("newsletter_subscribers")
      .select("confirmed")
      .eq("email", email)
      .maybeSingle();
    if (ex && !ex.confirmed) {
      await supabase.from("newsletter_subscribers").update({ confirm_token: confirmToken }).eq("email", email);
      void sendNewsletterConfirm(email, `${baseUrl(req)}/api/newsletter/confirm?token=${confirmToken}`);
    }
    return res.status(201).json({ ok: true });
  }

  void sendNewsletterConfirm(email, `${baseUrl(req)}/api/newsletter/confirm?token=${confirmToken}`);
  res.status(201).json({ ok: true });
});

// Potwierdzenie zapisu (klik z maila) → confirmed=true, potem PRZEKIEROWANIE
// na ładną podstronę sklepu (pełny branding, favicon, czcionki).
newsletterRouter.get("/confirm", async (req, res) => {
  const token = String(req.query.token ?? "").slice(0, 80);
  let ok = false;
  if (token) {
    const { data } = await supabase
      .from("newsletter_subscribers")
      .update({ confirmed: true, confirm_token: null })
      .eq("confirm_token", token)
      .select("email")
      .maybeSingle();
    ok = !!data;
  }
  const url = ok
    ? `${shopUrl()}/newsletter/potwierdzono?kod=${encodeURIComponent(WELCOME_CODE)}`
    : `${shopUrl()}/newsletter/potwierdzono`;
  res.redirect(302, url);
});

// Wypisanie (link ze stopki newslettera) → przekierowanie na podstronę sklepu.
newsletterRouter.get("/unsubscribe", async (req, res) => {
  const token = String(req.query.token ?? "").slice(0, 80);
  if (token) await supabase.from("newsletter_subscribers").delete().eq("unsub_token", token);
  res.redirect(302, `${shopUrl()}/newsletter/wypisano`);
});
