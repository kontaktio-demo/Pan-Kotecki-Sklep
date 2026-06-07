import { NextResponse, type NextRequest } from "next/server";

// Tryb „Wkrótce" — gdy sklep jest zamknięty (flaga z ustawień), trasy sklepowe
// (/sklep, /koszyk, /kasa) pokazują stronę „wkrótce". Reszta strony (główna,
// o nas, kontakt, regulamin…) działa normalnie.
const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

// lekki cache w pamięci instancji — żeby nie odpytywać backendu na każde żądanie
let cache: { open: boolean; ts: number } | null = null;

async function isShopOpen(): Promise<boolean> {
  if (!API) return true; // bez API nie blokujemy
  const now = Date.now();
  if (cache && now - cache.ts < 30_000) return cache.open;
  try {
    const r = await fetch(`${API}/api/settings/public`);
    if (!r.ok) return cache?.open ?? true;
    const d = (await r.json()) as { open?: boolean };
    const open = d?.open !== false;
    cache = { open, ts: now };
    return open;
  } catch {
    return cache?.open ?? true; // błąd sieci → nie blokuj
  }
}

export async function middleware(req: NextRequest) {
  // Strony płatności i potwierdzenia muszą działać zawsze — klient w trakcie
  // płatności nie może wpaść w „Wkrótce", nawet gdy sklep jest zamknięty.
  const path = req.nextUrl.pathname;
  if (path.startsWith("/kasa/dziekujemy") || path.startsWith("/kasa/platnosc")) return NextResponse.next();
  if (await isShopOpen()) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/wkrotce";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/sklep", "/sklep/:path*", "/koszyk", "/kasa", "/kasa/:path*"],
};
