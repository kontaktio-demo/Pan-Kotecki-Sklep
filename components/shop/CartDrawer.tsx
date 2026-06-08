"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart, cartTotal } from "@/store/cart";
import { formatPrice, FREE_SHIPPING_FROM } from "@/lib/format";
import ProductMedia from "./ProductMedia";

export default function CartDrawer() {
  const items = useCart((s) => s.items);
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const total = cartTotal(items);
  const toFree = Math.max(0, FREE_SHIPPING_FROM - total);
  const freeProgress = Math.min(100, (total / FREE_SHIPPING_FROM) * 100);

  return (
    <div className={`fixed inset-0 z-[150] ${isOpen ? "" : "pointer-events-none"}`} aria-hidden={!isOpen}>
      <div
        className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-500 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={close}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-milk shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Koszyk"
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-5">
          <span className="font-display text-lg">
            Koszyk{" "}
            <span className="text-ash">({items.reduce((s, i) => s + i.qty, 0)})</span>
          </span>
          <button onClick={close} className="text-sm text-ash transition-colors hover:text-ink" data-hover>
            Zamknij
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <p className="font-display text-2xl">Koszyk jest pusty</p>
            <p className="max-w-xs text-sm text-ash">
              Czas to zmienić. Twój kot na pewno coś sobie upatrzył.
            </p>
            <Link
              href="/sklep"
              onClick={close}
              className="rounded-full bg-ink px-6 py-3 text-sm text-milk transition-colors hover:bg-coral"
              data-hover
            >
              Przejdź do sklepu
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <ul className="flex flex-col divide-y divide-line">
                {items.map((item) => (
                  <li key={item.slug} className="flex gap-4 py-5">
                    <Link
                      href={`/sklep/${item.slug}`}
                      onClick={close}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line"
                    >
                      <ProductMedia image={item.image} name={item.name} motif={item.motif} sizes="5rem" />
                    </Link>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-3">
                        <Link
                          href={`/sklep/${item.slug}`}
                          onClick={close}
                          className="text-sm font-medium leading-snug transition-colors hover:text-coral"
                          data-hover
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => remove(item.slug)}
                          className="text-ash transition-colors hover:text-coral"
                          aria-label="Usuń"
                          data-hover
                        >
                          x
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div className="flex items-center rounded-full border border-line">
                          <button
                            onClick={() => setQty(item.slug, item.qty - 1)}
                            className="px-3 py-1 text-ash transition-colors hover:text-ink"
                            aria-label="Mniej"
                            data-hover
                          >
                            -
                          </button>
                          <span className="min-w-6 text-center text-sm tabular-nums">{item.qty}</span>
                          <button
                            onClick={() => setQty(item.slug, item.qty + 1)}
                            className="px-3 py-1 text-ash transition-colors hover:text-ink"
                            aria-label="Więcej"
                            data-hover
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm tabular-nums">{formatPrice(item.price * item.qty)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="border-t border-line px-6 py-5">
              {/* Dyskretna zachęta do darmowej dostawy */}
              <div className="pb-4">
                {toFree > 0 ? (
                  <p className="text-xs text-ink-soft">
                    Do darmowej dostawy brakuje <span className="font-semibold text-teal">{formatPrice(toFree)}</span>
                  </p>
                ) : (
                  <p className="text-xs font-medium text-teal">Masz darmową dostawę 🐾</p>
                )}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-teal transition-all duration-500" style={{ width: `${freeProgress}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-ash">Suma</span>
                <span className="font-display text-xl tabular-nums">{formatPrice(total)}</span>
              </div>
              <p className="pb-4 text-xs text-mist">Dostawa policzona przy zamówieniu.</p>
              <Link
                href="/kasa"
                onClick={close}
                className="tap block w-full rounded-xl bg-coral px-6 py-4 text-center text-sm font-semibold text-white shadow-lg shadow-coral/20 hover:bg-coral-deep"
              >
                Przejdź do kasy
              </Link>
              <button
                onClick={close}
                className="mt-2 w-full py-2 text-center text-sm text-ash transition-colors hover:text-ink"
              >
                Kontynuuj zakupy
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
