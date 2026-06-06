"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, cartTotal } from "@/store/cart";
import { formatPrice, FREE_SHIPPING_FROM } from "@/lib/format";
import ProductMedia from "./ProductMedia";
import { Button } from "@/components/ui/Button";

const DELIVERY = [
  { id: "kurier", label: "Kurier", sub: "1–2 dni robocze", cost: 14.99 },
  { id: "paczkomat", label: "Paczkomat 24/7", sub: "1–2 dni robocze", cost: 11.99 },
  { id: "odbior", label: "Odbiór osobisty", sub: "Łódź, ul. Przykładowa 1", cost: 0 },
];

const PAYMENT = [
  { id: "blik", label: "BLIK" },
  { id: "przelew", label: "Przelew online" },
  { id: "pobranie", label: "Za pobraniem" },
];

const inputCls =
  "w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink";

export default function CheckoutForm() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const subtotal = cartTotal(items);

  const [delivery, setDelivery] = useState("kurier");
  const [payment, setPayment] = useState("blik");

  if (items.length === 0) {
    return (
      <div className="container-edge flex flex-col items-center gap-5 py-20 text-center">
        <p className="text-2xl font-semibold">Koszyk jest pusty</p>
        <p className="max-w-md text-ink-soft">Dodaj produkty, aby złożyć zamówienie.</p>
        <Button href="/sklep" arrow>
          Przejdź do sklepu
        </Button>
      </div>
    );
  }

  const selected = DELIVERY.find((d) => d.id === delivery)!;
  const freeShipping = subtotal >= FREE_SHIPPING_FROM && delivery !== "odbior";
  const deliveryCost = freeShipping ? 0 : selected.cost;
  const total = subtotal + deliveryCost;

  const placeOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const nr = `KOT-${String(Date.now()).slice(-6)}`;
    try {
      sessionStorage.setItem("kotecki-order", JSON.stringify({ nr, total }));
    } catch {}
    clear();
    router.push("/kasa/dziekujemy");
  };

  return (
    <form onSubmit={placeOrder} className="container-edge grid gap-10 pb-24 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-9">
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-lg font-semibold">Dane kontaktowe</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <input required type="email" placeholder="E-mail" className={inputCls} />
            <input required type="tel" placeholder="Telefon" className={inputCls} />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-lg font-semibold">Adres dostawy</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <input required placeholder="Imię" className={inputCls} />
            <input required placeholder="Nazwisko" className={inputCls} />
          </div>
          <input required placeholder="Ulica i numer" className={inputCls} />
          <div className="grid gap-4 sm:grid-cols-[0.5fr_1fr]">
            <input required placeholder="Kod pocztowy" className={inputCls} />
            <input required placeholder="Miejscowość" className={inputCls} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-lg font-semibold">Sposób dostawy</legend>
          <div className="flex flex-col gap-2">
            {DELIVERY.map((d) => {
              const cost = subtotal >= FREE_SHIPPING_FROM && d.id !== "odbior" ? 0 : d.cost;
              return (
                <label
                  key={d.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
                    delivery === d.id ? "border-ink bg-cream" : "border-line hover:border-ink/40"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="delivery"
                      checked={delivery === d.id}
                      onChange={() => setDelivery(d.id)}
                      className="h-4 w-4 accent-coral"
                    />
                    <span>
                      <span className="block font-medium">{d.label}</span>
                      <span className="block text-xs text-ash">{d.sub}</span>
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">{cost === 0 ? "0 zł" : formatPrice(cost)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-lg font-semibold">Płatność</legend>
          <div className="flex flex-col gap-2">
            {PAYMENT.map((p) => (
              <label
                key={p.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                  payment === p.id ? "border-ink bg-cream" : "border-line hover:border-ink/40"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={payment === p.id}
                  onChange={() => setPayment(p.id)}
                  className="h-4 w-4 accent-coral"
                />
                <span className="font-medium">{p.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className="h-fit rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-32">
        <h2 className="text-lg font-semibold">Twoje zamówienie</h2>
        <ul className="mt-5 flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.slug} className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line">
                <ProductMedia image={item.image} name={item.name} motif={item.motif} sizes="3.5rem" />
                <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[0.65rem] text-milk">
                  {item.qty}
                </span>
              </div>
              <span className="flex-1 text-sm leading-snug">{item.name}</span>
              <span className="text-sm tabular-nums">{formatPrice(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2 border-t border-line pt-5 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-soft">Produkty</span>
            <span className="tabular-nums">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">Dostawa</span>
            <span className="tabular-nums">{deliveryCost === 0 ? "0 zł" : formatPrice(deliveryCost)}</span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <span className="font-medium">Razem</span>
          <span className="text-2xl font-semibold tabular-nums">{formatPrice(total)}</span>
        </div>

        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-coral px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-coral-deep"
        >
          Zamawiam i płacę
        </button>
        <p className="mt-3 text-center text-xs text-mist">
          Wersja demonstracyjna — płatność nie zostanie pobrana.
        </p>
      </aside>
    </form>
  );
}
