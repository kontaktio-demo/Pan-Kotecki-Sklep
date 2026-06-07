import type { Request, Response, NextFunction } from "express";
import { supabase } from "./supabase.js";

export interface CustomerRequest extends Request {
  customer?: { id: string; email: string };
}

// Wyciąga token „Bearer" z nagłówka Authorization.
function bearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (typeof h !== "string" || !h.startsWith("Bearer ")) return null;
  const token = h.slice(7).trim();
  return token.length > 0 ? token : null;
}

// Weryfikuje token konta klienta przez Supabase Auth (auth.users).
// Zwraca usera albo null — bez rzucania wyjątku.
async function verify(token: string): Promise<{ id: string; email: string } | null> {
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
