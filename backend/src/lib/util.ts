import { randomBytes } from "node:crypto";
import type { Response } from "express";
import { ZodError, type ZodSchema } from "zod";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// grosze → ładny zapis w złotówkach (np. „128,00 zł")
export const zloty = (grosze: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format((grosze ?? 0) / 100);

// Loguje prawdziwy błąd po stronie serwera, klientowi oddaje ogólny komunikat.
export function serverError(res: Response, where: string, err: unknown) {
  console.error(`[${where}]`, err);
  return res.status(500).json({ error: "Błąd serwera. Spróbuj ponownie." });
}

// Gdy :id nie jest poprawnym UUID - odsyła 404 i zwraca true (przerwij handler).
// Bez tego zła wartość trafia do bazy i Postgres oddaje 500 z komunikatem schematu.
export function badId(res: Response, id: string): boolean {
  if (UUID_RE.test(id)) return false;
  res.status(404).json({ error: "Nie znaleziono" });
  return true;
}

// Mapuje błąd zapisu na odpowiedź: 23505 (konflikt unikalności) → 409, reszta → 500 ogólny.
export function writeError(res: Response, where: string, err: { code?: string } | null) {
  if (err?.code === "23505") return res.status(409).json({ error: "Taki wpis już istnieje (zajęty slug/kod)" });
  return serverError(res, where, err);
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
      // tylko ścieżka + komunikat (bez ujawniania wewnętrznego schematu/typów/enumów)
      const issues = e.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
      res.status(400).json({ error: "Błędne dane", issues });
    } else {
      res.status(400).json({ error: "Błędne dane" });
    }
    return null;
  }
}
