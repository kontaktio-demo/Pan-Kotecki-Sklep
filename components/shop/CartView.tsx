"use client";

import Link from "next/link";
import { useCart, cartTotal } from "@/store/cart";
import { formatPrice, FREE_SHIPPING_FROM } from "@/lib/format";
import ProductMedia from "./ProductMedia";
import { Button } from "@/components/ui/Button";

export default function CartView() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const total = cartTotal(items);
  const toFree = Math.max(0, FREE_SHIPPING_FROM - total);
  const freeProgress = Math.min(100, (total / FREE_SHIPPING_FROM) * 100);

  if (items.length === 0) {
    return (
      <div className="container-edge flex flex-col items-center gap-6 py-24 text-center">
        <p className="font-display text-4xl">Twój koszyk jest pusty</p>
        <p className="max-w-md text-ink-soft">
          Zajrzyj do sklepu - coś dla siebie albo dla kota na pewno się znajdzie.
        </p>
        <Button href="/sklep" arrow>
          Przejdź do sklepu
        </Button>
      </div>
    );
  }

  return (
    <div className="container-edge grid gap-12 pb-24 lg:grid-cols-[1.5fr_1fr]">
      <ul className="flex flex-col divide-y divide-line border-t border-line">
        {items.map((item) => (
          <li key={item.slug} className="flex gap-5 py-6">
            <Link
              href={`/sklep/${item.slug}`}
              className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-line"
            >
              <ProductMedia image={item.image} name={item.name} motif={item.motif} sizes="6rem" />
            </Link>
            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={`/sklep/${item.slug}`}
                  className="font-display text-xl transition-colors hover:text-coral"
                  data-hover
                >
                  {item.name}
                </Link>
                <span className="tabular-nums">{formatPrice(item.price * item.qty)}</span>
              </div>
              <div className="mt-auto flex items-center justify-between pt-4">
                <div className="flex items-center rounded-full border border-ink/15">
                  <button onClick={() => setQty(item.slug, item.qty - 1)} className="px-4 py-2 text-ash hover:text-ink" data-hover>
                    -
                  </button>
                  <span className="min-w-7 text-center text-sm tabular-nums">{item.qty}</span>
                  <button onClick={() => setQty(item.slug, item.qty + 1)} className="px-4 py-2 text-ash hover:text-ink" data-hover>
                    +
                  </button>
                </div>
                <button
                  onClick={() => remove(item.slug)}
                  className="text-sm text-ash transition-colors hover:text-coral"
                  data-hover
                >
                  Usuń
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-2xl bg-cream p-8 lg:sticky lg:top-28">
        <h2 className="font-display text-2xl">Podsumowanie</h2>
        <div className="mt-6 flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-soft">Wartość produktów</span>
            <span className="tabular-nums">{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">Dostawa</span>
            <span className="text-ash">liczona przy płatności</span>
          </div>
        </div>
        <div className="mt-6 flex justify-between border-t border-line pt-6">
          <span className="font-medium">Razem</span>
          <span className="font-display text-2xl tabular-nums">{formatPrice(total)}</span>
        </div>

        {/* Dyskretna zachęta do darmowej dostawy - w treści, nie popup */}
        <div className="mt-5">
          {toFree > 0 ? (
            <p className="text-sm text-ink-soft">
              Dorzuć jeszcze <span className="font-semibold text-teal">{formatPrice(toFree)}</span>, a dostawa będzie gratis.
            </p>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-teal">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12 5 5L20 7" />
              </svg>
              Masz darmową dostawę 🐾
            </p>
          )}
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-teal transition-all duration-500" style={{ width: `${freeProgress}%` }} />
          </div>
        </div>

        <Link
          href="/kasa"
          className="tap mt-7 block w-full rounded-xl bg-coral px-6 py-4 text-center text-sm font-semibold text-white shadow-lg shadow-coral/20 hover:bg-coral-deep"
        >
          Przejdź do kasy
        </Link>
        <Link
          href="/sklep"
          className="mt-3 block text-center text-sm text-ash transition-colors hover:text-ink"
        >
          Kontynuuj zakupy
        </Link>
      </aside>
    </div>
  );
}
