import { randomBytes } from "node:crypto";
import type { Response } from "express";
import { ZodError, type ZodSchema } from "zod";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Loguje prawdziwy błąd po stronie serwera, klientowi oddaje ogólny komunikat.
export function serverError(res: Response, where: string, err: unknown) {
  console.error(`[${where}]`, err);
  return res.status(500).json({ error: "Błąd serwera. Spróbuj ponownie." });
}

const PL_MAP: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => PL_MAP[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "produkt";
}

export function orderNumber(): string {
  const t = Date.now().toString(36).toUpperCase().slice(-6);
  const r = randomBytes(3).toString("hex").toUpperCase();
  return `PK-${t}${r}`;
}

// Waliduje body wg schematu zod; przy błędzie odsyła 400 i zwraca null.
export function parseBody<T>(schema: ZodSchema<T>, body: unknown, res: Response): T | null {
  try {
    return schema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) {
      res.status(400).json({ error: "Błędne dane", issues: e.issues });
    } else {
      res.status(400).json({ error: "Błędne dane" });
    }
    return null;
  }
}
