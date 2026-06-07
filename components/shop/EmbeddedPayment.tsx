"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { formatPrice } from "@/lib/format";
import ProductMedia from "./ProductMedia";

const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

type SummaryItem = { slug: string; name: string; price: number; qty: number; image?: string; motif?: string };
type Summary = { items: SummaryItem[]; subtotal: number; shipping: number; discount: number; total: number; delivery: string };

export default function EmbeddedPayment() {
  const stripePromise = useMemo(() => (PK ? loadStripe(PK) : null), []);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setClientSecret(sessionStorage.getItem("kotecki-pay"));
      const raw = sessionStorage.getItem("kotecki-pay-summary");
      if (raw) setSummary(JSON.parse(raw) as Summary);
    } catch {}
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!stripePromise || !clientSecret) {
    return (
      <div className="container-edge flex flex-col items-center gap-4 py-20 text-center">
        <span className="text-4xl" aria-hidden="true">🐾</span>
        <p className="text-lg font-semibold">Brak aktywnej płatności</p>
        <p className="max-w-md text-ink-soft">
          Sesja płatności wygasła lub otworzyłeś tę stronę bezpośrednio. Wróć do koszyka i złóż zamówienie ponownie.
        </p>
        <Link href="/koszyk" className="tap mt-1 rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-milk hover:bg-coral">
          Wróć do koszyka
        </Link>
      </div>
    );
  }

  return (
    <div className="container-edge py-8 md:py-12">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_360px]">
        {/* Formularz płatności */}
        <div className="min-w-0 lg:order-1">
          <h1 className="mb-1 text-2xl font-semibold md:text-3xl">Płatność</h1>
          <p className="mb-6 inline-flex items-center gap-1.5 text-sm text-ash">
            <span aria-hidden="true">🔒</span> Bezpieczna płatność — karta, BLIK, Przelewy24
          </p>
          <div className="overflow-hidden rounded-2xl border border-line bg-white p-1 shadow-sm">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
          <p className="mt-4">
            <Link href="/koszyk" className="text-sm text-ash underline-offset-2 transition-colors hover:text-ink hover:underline">
              ← Wróć do koszyka
            </Link>
          </p>
        </div>

        {/* Podsumowanie zamówienia */}
        {summary && (
          <aside className="lg:order-2">
            <div className="rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-28">
              <h2 className="text-lg font-semibold">Twoje zamówienie</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {summary.items.map((it) => (
                  <li key={it.slug} className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-cream">
                      <ProductMedia image={it.image} name={it.name} motif={it.motif ?? ""} sizes="3.5rem" />
                      <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[0.65rem] text-milk tabular-nums">
                        {it.qty}
                      </span>
                    </div>
                    <span className="min-w-0 flex-1 text-sm leading-snug">{it.name}</span>
                    <span className="shrink-0 text-sm tabular-nums">{formatPrice(it.price * it.qty)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-soft">Produkty</span>
                  <span className="tabular-nums">{formatPrice(summary.subtotal)}</span>
                </div>
                {summary.discount > 0 && (
                  <div className="flex justify-between font-medium text-teal">
                    <span>Rabat</span>
                    <span className="tabular-nums">−{formatPrice(summary.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-ink-soft">{summary.delivery || "Dostawa"}</span>
                  <span className="tabular-nums">{summary.shipping === 0 ? "0 zł" : formatPrice(summary.shipping)}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="font-medium">Razem</span>
                <span className="text-xl font-semibold tabular-nums">{formatPrice(summary.total)}</span>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
