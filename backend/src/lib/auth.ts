import { timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export interface AdminRequest extends Request {
  admin?: { id: string; email: string };
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// Panel desktopowy uwierzytelnia się stałym kluczem (nagłówek x-admin-key).
// Brak ekranu logowania — klucz wpisuje się w aplikacji raz.
export function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const key = process.env.ADMIN_API_KEY;
  if (!key) return res.status(503).json({ error: "Panel nieskonfigurowany (brak ADMIN_API_KEY)" });

  const provided = req.headers["x-admin-key"];
  if (typeof provided !== "string" || !safeEqual(provided, key)) {
    return res.status(401).json({ error: "Brak autoryzacji" });
  }
  req.admin = { id: "panel", email: "panel" };
  next();
}
