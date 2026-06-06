"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";

export default function OrderConfirmation() {
  const [order, setOrder] = useState<{ nr: string; total: number } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("kotecki-order");
      if (raw) setOrder(JSON.parse(raw));
    } catch {}
  }, []);

  return (
    <div className="container-edge flex flex-col items-center py-20 text-center md:py-28">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <path d="M5 12.5l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      <h1 className="mt-6 text-3xl font-semibold md:text-4xl">Dziękujemy za zamówienie!</h1>
      <p className="mt-4 max-w-md text-ink-soft">
        Przyjęliśmy Twoje zamówienie do realizacji. Potwierdzenie wysłaliśmy na
        podany adres e-mail.
      </p>

      {order && (
        <div className="mt-8 w-full max-w-sm rounded-2xl border border-line bg-white p-6 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-ash">Numer zamówienia</span>
            <span className="font-semibold">{order.nr}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-ash">Do zapłaty</span>
            <span className="font-semibold tabular-nums">{formatPrice(order.total)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-ash">Status</span>
            <span className="font-medium text-emerald-600">Opłacone</span>
          </div>
        </div>
      )}

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Button href="/sklep" arrow>
          Kontynuuj zakupy
        </Button>
        <Button href="/" variant="outline">
          Strona główna
        </Button>
      </div>

      <p className="mt-8 max-w-md text-xs text-mist">
        To wersja demonstracyjna sklepu — zamówienie nie zostało faktycznie
        zrealizowane, a płatność nie została pobrana.
      </p>
    </div>
  );
}
