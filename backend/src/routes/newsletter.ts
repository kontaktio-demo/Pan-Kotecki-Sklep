import { randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { parseBody, serverError } from "../lib/util.js";
import { sendNewsletterConfirm, welcomeCodeHtml } from "../lib/email.js";
import { verifyCaptcha } from "../lib/captcha.js";

export const newsletterRouter = Router();

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

// Potwierdzenie zapisu (klik z maila) → confirmed=true + strona z kodem.
newsletterRouter.get("/confirm", async (req, res) => {
  const token = String(req.query.token ?? "").slice(0, 80);
  if (!token) return res.status(400).send("Brak tokenu");
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .update({ confirmed: true, confirm_token: null })
    .eq("confirm_token", token)
    .select("email")
    .maybeSingle();
  if (error) return serverError(res, "newsletter.confirm", error);
  res.set("Content-Type", "text/html; charset=utf-8");
  if (!data) return res.status(404).send(welcomeCodeHtml()); // token zużyty/nieznany — i tak pokaż przyjaznie
  res.send(welcomeCodeHtml());
});

// Wypisanie (link ze stopki newslettera).
newsletterRouter.get("/unsubscribe", async (req, res) => {
  const token = String(req.query.token ?? "").slice(0, 80);
  res.set("Content-Type", "text/html; charset=utf-8");
  if (token) await supabase.from("newsletter_subscribers").delete().eq("unsub_token", token);
  res.send(
    `<div style="font-family:Arial,sans-serif;max-width:480px;margin:60px auto;text-align:center;color:#1d1810">
       <div style="font-size:22px;font-weight:700">Pan Kotecki<span style="color:#ef7a30">.</span> 🐾</div>
       <h1 style="font-size:22px">Wypisano z newslettera</h1>
       <p style="color:#3c352b">Nie będziemy już wysyłać Ci wiadomości. Zawsze możesz wrócić.</p>
       <a href="https://pankotecki.pl" style="color:#ee5340;font-weight:700;text-decoration:none">Wróć do sklepu →</a>
     </div>`,
  );
});
