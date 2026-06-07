"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/format";

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

type Phase = "checking" | "paid" | "pending" | "failed";

export default function OrderConfirmation() {
  const clear = useCart((s) => s.clear);
  const [order, setOrder] = useState<{ nr: string; total?: number } | null>(null);
  const [phase, setPhase] = useState<Phase>("checking");

  useEffect(() => {
    let nr = "";
    let total: number | undefined;
    try {
      nr = new URLSearchParams(window.location.search).get("order") ?? "";
      const raw = sessionStorage.getItem("kotecki-order");
      if (raw) {
        const o = JSON.parse(raw) as { nr: string; total?: number };
        nr = nr || o.nr;
        total = o.total;
      }
    } catch {}
    if (nr) setOrder({ nr, total });

    // Brak API (tryb demo) lub brak numeru → traktujemy jak złożone.
    if (!API || !nr) {
      setPhase("paid");
      clear();
      return;
    }

    let tries = 0;
    let alive = true;
    const poll = async () => {
      try {
        const r = await fetch(`${API}/api/order-status/${encodeURIComponent(nr)}`, { cache: "no-store" });
        if (r.ok) {
          const d = (await r.json()) as { paymentStatus: string; status: string };
          if (d.paymentStatus === "paid") {
            if (!alive) return;
            setPhase("paid");
            clear();
            return;
          }
          if (d.paymentStatus === "failed" || d.status === "cancelled") {
            if (!alive) return;
            setPhase("failed"); // koszyka nie czyścimy — można spróbować ponownie
            return;
          }
        }
      } catch {}
      tries += 1;
      if (!alive) return;
      setPhase("pending");
      // koszyka NIE czyścimy przy oczekiwaniu — opróżniamy dopiero po potwierdzeniu 'paid'
      if (tries < 8) setTimeout(poll, 3000);
    };
    poll();
    return () => {
      alive = false;
    };
  }, [clear]);

  const failed = phase === "failed";

  return (
    <div className="container-edge flex flex-col items-center py-20 text-center md:py-28">
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-full text-white ${
          failed ? "bg-red-500" : phase === "paid" ? "bg-emerald-500" : "bg-amber-400"
        }`}
      >
        {failed ? (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>

      <h1 className="mt-6 text-3xl font-semibold md:text-4xl">
        {failed ? "Płatność nie powiodła się" : "Dziękujemy za zamówienie!"}
      </h1>
      <p className="mt-4 max-w-md text-ink-soft">
        {phase === "paid" &&
          "Płatność potwierdzona — pakujemy z miłością i pod czujnym okiem kota. Potwierdzenie wysłaliśmy na Twój e-mail."}
        {phase === "pending" &&
          "Przyjęliśmy Twoje zamówienie. Czekamy na potwierdzenie płatności (BLIK/Przelewy24 może chwilę potrwać) — damy znać e-mailem."}
        {phase === "checking" && "Sprawdzamy status płatności…"}
        {failed && "Nie udało się pobrać płatności. Twój koszyk jest nadal aktywny — możesz spróbować ponownie."}
      </p>

      {order && !failed && (
        <div className="mt-8 w-full max-w-sm rounded-2xl border border-line bg-white p-6 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-ash">Numer zamówienia</span>
            <span className="font-semibold">{order.nr}</span>
          </div>
          {typeof order.total === "number" && (
            <div className="flex justify-between py-1">
              <span className="text-ash">Kwota</span>
              <span className="font-semibold tabular-nums">{formatPrice(order.total)}</span>
            </div>
          )}
          <div className="flex justify-between py-1">
            <span className="text-ash">Status płatności</span>
            <span className={`font-medium ${phase === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
              {phase === "paid" ? "Opłacone" : "Oczekuje"}
            </span>
          </div>
        </div>
      )}

      {!failed && (
        <p className="mt-7 inline-flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-sm text-teal-deep">
          <span aria-hidden="true">🐾</span>
          Spodobało się? Opowiedz znajomemu kociarzowi — kot się ucieszy.
        </p>
      )}

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        {failed ? (
          <Button href="/kasa" arrow>
            Spróbuj ponownie
          </Button>
        ) : (
          <Button href="/sklep" arrow>
            Kontynuuj zakupy
          </Button>
        )}
        <Button href="/" variant="outline">
          Strona główna
        </Button>
      </div>
    </div>
  );
}
