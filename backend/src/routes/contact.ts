import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { parseBody, serverError } from "../lib/util.js";
import { notifyOwnerContact } from "../lib/email.js";

export const contactRouter = Router();

const schema = z.object({
  name: z.string().max(120).optional(),
  email: z.string().email().max(160),
  subject: z.string().max(160).optional(),
  message: z.string().min(1).max(5000),
});

// Zapisuje wiadomość do bazy (nic nie ginie). E-mail powiadamiający można
// dołożyć później po podłączeniu dostawcy (Resend/Postmark) — tu nie wymagany.
contactRouter.post("/", async (req, res) => {
  const body = parseBody(schema, req.body, res);
  if (!body) return;
  const ua = String(req.headers["user-agent"] ?? "").slice(0, 300);
  const { error } = await supabase.from("contact_messages").insert({
    name: body.name?.trim() || null,
    email: body.email.trim().toLowerCase(),
    subject: body.subject?.trim() || null,
    message: body.message.trim(),
    user_agent: ua,
  });
  if (error) return serverError(res, "contact", error);
  void notifyOwnerContact({ name: body.name ?? null, email: body.email, subject: body.subject ?? null, message: body.message });
  res.status(201).json({ ok: true });
});
