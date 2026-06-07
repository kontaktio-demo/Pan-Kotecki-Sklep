"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadStripe, type Appearance } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { formatPrice } from "@/lib/format";
import ProductMedia from "./ProductMedia";

const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = PK ? loadStripe(PK) : null;

type SummaryItem = { slug: string; name: string; price: number; qty: number; image?: string; motif?: string };
type Summary = { items: SummaryItem[]; subtotal: number; shipping: number; discount: number; total: number; delivery: string };

// Wygląd formularza Stripe dopasowany do palety sklepu (krem / koral / atrament).
const appearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#ee5340",
    colorBackground: "#ffffff",
    colorText: "#1d1810",
    colorTextSecondary: "#7c7264",
    colorTextPlaceholder: "#bcb3a4",
    colorDanger: "#dc2626",
    colorSuccess: "#156b64",
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    fontSizeBase: "15px",
    borderRadius: "12px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": { border: "1px solid #e8e0d2", boxShadow: "none", padding: "12px 14px" },
    ".Input:focus": { border: "1px solid #1d1810", boxShadow: "none", outline: "none" },
    ".Input--invalid": { border: "1px solid #dc2626" },
    ".Label": { color: "#7c7264", fontWeight: "500", fontSize: "13px" },
    ".Tab": { border: "1px solid #e8e0d2", borderRadius: "12px", boxShadow: "none" },
    ".Tab:hover": { border: "1px solid #bcb3a4" },
    ".Tab--selected": { border: "1px solid #1d1810", backgroundColor: "#f8f4ec", boxShadow: "none" },
    ".Block": { border: "1px solid #e8e0d2", borderRadius: "16px", boxShadow: "none" },
  },
};

function PayForm({ total, orderNr }: { total: number; orderNr: string | null }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setErr("");
    const back = `${window.location.origin}/kasa/dziekujemy?order=${encodeURIComponent(orderNr ?? "")}`;
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: back },
      redirect: "if_required",
    });
    if (error) {
      setErr(error.message ?? "Płatność nie powiodła się. Spróbuj ponownie.");
      setBusy(false);
      return;
    }
    if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
      router.push(`/kasa/dziekujemy?order=${encodeURIComponent(orderNr ?? "")}`);
      return;
    }
    setBusy(false);
  }

  return (
    <form onSubmit={pay}>
      <PaymentElement options={{ layout: "tabs" }} />
      {err && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}
      <button
        type="submit"
        disabled={busy || !stripe || !elements}
        className="tap mt-5 w-full rounded-xl bg-coral px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-coral/20 hover:bg-coral-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Przetwarzam..." : `Zapłać ${formatPrice(total)}`}
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-mist">
        <span aria-hidden="true">🔒</span> Płatność szyfrowana, obsługiwana przez Stripe
      </p>
    </form>
  );
}

export default function EmbeddedPayment() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orderNr, setOrderNr] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setClientSecret(sessionStorage.getItem("kotecki-pay"));
      const raw = sessionStorage.getItem("kotecki-pay-summary");
      if (raw) {
        const s = JSON.parse(raw) as Summary;
        setSummary(s);
        setTotal(s.total);
      }
      const ord = sessionStorage.getItem("kotecki-order");
      if (ord) {
        const o = JSON.parse(ord) as { nr?: string; total?: number };
        setOrderNr(o?.nr ?? null);
        if (o?.total != null) setTotal((t) => t || o.total!);
      }
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
          <h1 className="text-2xl font-semibold md:text-3xl">Płatność</h1>
          <p className="mb-6 mt-1 text-sm text-ash">
            {orderNr ? (
              <>Zamówienie <span className="font-medium text-ink">{orderNr}</span> - dokończ płatność poniżej</>
            ) : (
              <>Dokończ płatność, aby złożyć zamówienie</>
            )}
          </p>
          <div className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
            <Elements stripe={stripePromise} options={{ clientSecret, appearance, locale: "pl" }}>
              <PayForm total={total} orderNr={orderNr} />
            </Elements>
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

              <ul className="mt-5 flex flex-col gap-2 border-t border-line pt-4 text-xs text-ash">
                <li className="flex items-center gap-2"><span aria-hidden="true">🔒</span> Bezpieczne, szyfrowane płatności</li>
                <li className="flex items-center gap-2"><span aria-hidden="true">🚚</span> Wysyłka w 24h, prosto do paczkomatu</li>
                <li className="flex items-center gap-2"><span aria-hidden="true">↩️</span> 14 dni na spokojny zwrot</li>
              </ul>
              <p className="mt-4 text-xs text-mist">
                Coś nie tak?{" "}
                <Link href="/kontakt" className="underline hover:text-ink">Napisz do nas</Link> 🐾
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
