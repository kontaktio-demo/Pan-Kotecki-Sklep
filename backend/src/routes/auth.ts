import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { signToken } from "../lib/auth.js";
import { parseBody, serverError } from "../lib/util.js";

export const authRouter = Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

const creds = z.object({ email: z.string().email(), password: z.string().min(6) });
// stały hash do porównania, gdy konto nie istnieje (ochrona przed timing/enumeracją)
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8Dv.Hbq0pT3v6mJ8z5l9z5l9z5l9zO";

// Tworzy PIERWSZEGO admina — wymaga klucza ADMIN_BOOTSTRAP_KEY i pustej tabeli admins.
authRouter.post("/bootstrap", limiter, async (req, res) => {
  const body = parseBody(creds.extend({ name: z.string().optional(), key: z.string() }), req.body, res);
  if (!body) return;

  const expected = process.env.ADMIN_BOOTSTRAP_KEY;
  if (!expected || body.key !== expected) return res.status(403).json({ error: "Brak uprawnień" });

  const { count, error: countErr } = await supabase.from("admins").select("*", { count: "exact", head: true });
  if (countErr) return serverError(res, "bootstrap.count", countErr);
  if ((count ?? 0) > 0) return res.status(403).json({ error: "Administrator już istnieje" });

  const password_hash = await bcrypt.hash(body.password, 10);
  const { data, error } = await supabase
    .from("admins")
    .insert({ email: body.email.toLowerCase(), password_hash, name: body.name ?? "Admin" })
    .select("id, email, name")
    .single();
  if (error) return res.status(error.code === "23505" ? 409 : 500).json({ error: error.code === "23505" ? "Administrator już istnieje" : "Błąd serwera" });

  res.json({ token: signToken({ id: data.id, email: data.email }), admin: { email: data.email, name: data.name } });
});

authRouter.post("/login", limiter, async (req, res) => {
  const body = parseBody(creds, req.body, res);
  if (!body) return;

  const { data: admin } = await supabase
    .from("admins")
    .select("id, email, name, password_hash")
    .eq("email", body.email.toLowerCase())
    .maybeSingle();

  // Zawsze wykonujemy bcrypt.compare (stały czas niezależnie od istnienia konta).
  const ok = await bcrypt.compare(body.password, admin?.password_hash ?? DUMMY_HASH);
  if (!admin || !ok) return res.status(401).json({ error: "Błędny e-mail lub hasło" });

  res.json({ token: signToken({ id: admin.id, email: admin.email }), admin: { email: admin.email, name: admin.name } });
});
