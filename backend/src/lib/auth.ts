import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET nie jest ustawiony — wymagany do logowania panelu.");
}
const SECRET: string = process.env.JWT_SECRET;

export type AdminPayload = { id: string; email: string };

export interface AdminRequest extends Request {
  admin?: AdminPayload;
}

export function signToken(payload: AdminPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Brak autoryzacji" });
  }
  try {
    const decoded = jwt.verify(header.slice(7), SECRET) as AdminPayload;
    req.admin = { id: decoded.id, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ error: "Sesja wygasła — zaloguj się ponownie" });
  }
}
