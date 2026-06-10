"use client";

import { useEffect, useState } from "react";
import Paw from "@/components/ui/Paw";
import { subscribeToasts, type ToastItem } from "@/lib/toast";

// Dyskretne potwierdzenia akcji (zapis, ulubione) - dół ekranu, znikają same.
// To feedback, nie marketing: zero przycisków, zero przykrywania treści.
export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setItems), []);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className="flex animate-[fadeUp_0.25s_var(--ease-out-expo)_both] items-center gap-2.5 rounded-xl border border-line bg-milk px-4 py-3 text-sm font-medium text-ink shadow-lg"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-peach text-orange-deep">
            <Paw className="h-3.5 w-3.5" />
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
