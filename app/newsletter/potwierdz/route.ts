import { type NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

// Klikalny link z maila (na domenie sklepu): potwierdza zapis przez backend,
// po czym ląduje na ładnej, brandowanej podstronie z kodem.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  let ok = false;
  let code = "";
  if (API && token) {
    try {
      const r = await fetch(`${API}/api/newsletter/confirm?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      const d = (await r.json()) as { ok?: boolean; code?: string | null };
      ok = !!d.ok;
      code = d.code ?? "";
    } catch {}
  }
  const url = new URL("/newsletter/potwierdzono", req.url);
  if (ok && code) url.searchParams.set("kod", code);
  return NextResponse.redirect(url);
}
