"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("kotecki-cookies")) setShow(true);
    } catch {}
  }, []);

  if (!show) return null;

  const accept = () => {
    try {
      localStorage.setItem("kotecki-cookies", "1");
    } catch {}
    setShow(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[55] px-3 pb-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}>
      <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-[0_10px_40px_-12px_rgba(20,20,20,0.3)]">
        <span className="text-2xl" aria-hidden="true">
          🍪
        </span>
        <p className="flex-1 text-sm text-ink-soft">
          Używamy niezbędnych cookies, żeby koszyk i sklep mruczały jak należy 🐾{" "}
          <Link href="/polityka-prywatnosci" className="underline hover:text-ink">
            Więcej
          </Link>
        </p>
        <button
          onClick={accept}
          className="shrink-0 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-milk transition-colors hover:bg-coral"
        >
          OK
        </button>
      </div>
    </div>
  );
}
