"use client";

import { useState } from "react";
import { useCart } from "@/store/cart";

type Item = {
  slug: string;
  name: string;
  price: number;
  motif: string;
  tone: string;
  image?: string;
  inStock?: boolean;
};

function CartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 4h2l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.2L20.5 8H6.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="20" r="1.4" fill="currentColor" />
      <circle cx="17.5" cy="20" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function AddToCartCompact({ item }: { item: Item }) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const unavailable = item.inStock === false;

  if (unavailable) {
    return (
      <button
        disabled
        className="mt-3 inline-flex w-full cursor-not-allowed items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-line bg-cream px-3 py-2.5 text-sm font-medium text-ash"
      >
        Niedostępny
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        add(item);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
      className="tap mt-3 inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-ink px-3 py-2.5 text-sm font-medium text-milk hover:bg-coral"
    >
      <CartIcon />
      {added ? "Dodano ✓" : "Do koszyka"}
    </button>
  );
}

export function AddToCartFull({ item }: { item: Item }) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const unavailable = item.inStock === false;

  if (unavailable) {
    return (
      <button
        disabled
        className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-line bg-cream px-8 py-4 text-sm font-semibold text-ash"
      >
        Chwilowo niedostępny
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center rounded-xl border border-ink/20">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="px-5 py-3.5 text-ash transition-colors hover:text-ink"
          aria-label="Mniej"
        >
          −
        </button>
        <span className="min-w-8 text-center tabular-nums">{qty}</span>
        <button
          onClick={() => setQty((q) => q + 1)}
          className="px-5 py-3.5 text-ash transition-colors hover:text-ink"
          aria-label="Więcej"
        >
          +
        </button>
      </div>
      <button
        onClick={() => {
          add(item, qty);
          setAdded(true);
          setTimeout(() => setAdded(false), 1400);
        }}
        className="tap inline-flex flex-1 items-center justify-center gap-2.5 rounded-xl bg-coral px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-coral/20 hover:bg-coral-deep"
      >
        <CartIcon />
        {added ? "Dodano do koszyka ✓" : "Dodaj do koszyka"}
      </button>
    </div>
  );
}
