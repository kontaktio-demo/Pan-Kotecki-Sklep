import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { parseBody, serverError } from "../lib/util.js";

export const newsletterRouter = Router();

const schema = z.object({
  email: z.string().email().max(160),
  consent: z.boolean().optional(),
  source: z.string().max(40).optional(),
});

// Zapisuje subskrybenta wraz z DOWODEM zgody (consent_at). Bez zgody = 400.
// Double opt-in (potwierdzenie mailem) dołożysz po podłączeniu dostawcy e-mail.
newsletterRouter.post("/", async (req, res) => {
  const body = parseBody(schema, req.body, res);
  if (!body) return;
  if (body.consent === false) {
    return res.status(400).json({ error: "Do zapisu wymagana jest zgoda na newsletter." });
  }
  const email = body.email.trim().toLowerCase();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email, consent: true, source: body.source ?? "web" });
  // 23505 = już zapisany → traktujemy jak sukces (idempotentnie)
  if (error && error.code !== "23505") return serverError(res, "newsletter", error);
  res.status(201).json({ ok: true });
});
