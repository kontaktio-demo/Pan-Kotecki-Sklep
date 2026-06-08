import { type NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

// Link „wypisz się" z newslettera (na domenie sklepu): wypisuje przez backend,
// po czym ląduje na brandowanej podstronie potwierdzenia.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (API && token) {
    try {
      await fetch(`${API}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`, { cache: "no-store" });
    } catch {}
  }
  return NextResponse.redirect(new URL("/newsletter/wypisano", req.url));
}
