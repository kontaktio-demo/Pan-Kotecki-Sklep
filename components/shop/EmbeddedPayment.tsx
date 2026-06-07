"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";

const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export default function EmbeddedPayment() {
  const stripePromise = useMemo(() => (PK ? loadStripe(PK) : null), []);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setClientSecret(sessionStorage.getItem("kotecki-pay"));
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
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 text-2xl font-semibold md:text-3xl">Płatność</h1>
        <p className="mb-6 inline-flex items-center gap-1.5 text-sm text-ash">
          <span aria-hidden="true">🔒</span> Bezpieczna płatność — karta, BLIK, Przelewy24
        </p>
        <div className="overflow-hidden rounded-2xl border border-line bg-white p-1 shadow-sm">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
        <p className="mt-4 text-center">
          <Link href="/koszyk" className="text-sm text-ash underline-offset-2 transition-colors hover:text-ink hover:underline">
            ← Wróć do koszyka
          </Link>
        </p>
      </div>
    </div>
  );
}
