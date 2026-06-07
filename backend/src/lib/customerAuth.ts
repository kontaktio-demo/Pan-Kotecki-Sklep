import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { supabase } from "./supabase.js";

export interface CustomerRequest extends Request {
  customer?: { id: string; email: string };
}

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

// Wyciąga token „Bearer" z nagłówka Authorization.
function bearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (typeof h !== "string" || !h.startsWith("Bearer ")) return null;
  const token = h.slice(7).trim();
  return token.length > 0 ? token : null;
}

function b64urlJson(part: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

// Szybka, LOKALNA weryfikacja HS256 (bez round-tripu sieciowego do Supabase).
// Zwraca usera tylko gdy podpis i exp są poprawne; w razie wątpliwości → null (fallback).
function verifyLocalHs256(token: string): { id: string; email: string } | null {
  if (!JWT_SECRET) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  let header: Record<string, unknown>;
  try {
    header = b64urlJson(parts[0]);
  } catch {
    return null;
  }
  if (header.alg !== "HS256") return null; // projekt z kluczem asymetrycznym → fallback do getUser
  const expected = createHmac("sha256", JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest();
  let sig: Buffer;
  try {
    sig = Buffer.from(parts[2], "base64url");
  } catch {
    return null;
  }
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null;
  let payload: Record<string, unknown>;
  try {
    payload = b64urlJson(parts[1]);
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < now) return null;
  if (!payload.sub) return null;
  return { id: String(payload.sub), email: String(payload.email ?? "").toLowerCase() };
}

// Weryfikacja tokenu konta klienta: najpierw lokalnie (szybko), w razie potrzeby
// autorytatywnie przez Supabase Auth. Zwraca usera albo null — bez wyjątku.
async function verify(token: string): Promise<{ id: string; email: string } | null> {
  const local = verifyLocalHs256(token);
  if (local) return local;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) return null;
    return { id: data.user.id, email: (data.user.email ?? "").toLowerCase() };
  } catch {
    return null;
  }
}

// Wymaga zalogowanego klienta — w przeciwnym razie 401.
export async function requireCustomer(req: CustomerRequest, res: Response, next: NextFunction) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: "Zaloguj się, aby kontynuować" });
  const user = await verify(token);
  if (!user) return res.status(401).json({ error: "Sesja wygasła — zaloguj się ponownie" });
  req.customer = user;
  next();
}

// Opcjonalne logowanie — jeśli token jest i jest poprawny, doklej req.customer.
// Jeśli go nie ma (gość), po prostu przepuść. Używane w checkoucie.
export async function withCustomer(req: CustomerRequest, _res: Response, next: NextFunction) {
  const token = bearer(req);
  if (token) {
    const user = await verify(token);
    if (user) req.customer = user;
  }
  next();
}
