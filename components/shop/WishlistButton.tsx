"use client";

import { useEffect, useState } from "react";
import { useWishlist, pushWishlistChange } from "@/store/wishlist";
import { getAccessToken } from "@/lib/account";
import { toast } from "@/lib/toast";

// Serduszko "do ulubionych" - na karcie produktu (wariant overlay) i na stronie
// produktu (wariant przycisku). Działa dla gości (localStorage) i kont (sync).
export default function WishlistButton({
  slug,
  name,
  variant = "overlay",
}: {
  slug: string;
  name: string;
  variant?: "overlay" | "button";
}) {
  const has = useWishlist((s) => s.slugs.includes(slug));
  const toggle = useWishlist((s) => s.toggle);
  // zustand persist + SSR: serce renderujemy dopiero po mount (bez hydration mismatch)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const active = mounted && has;

  async function onToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const added = toggle(slug);
    toast(added ? "Dodano do ulubionych" : "Usunięto z ulubionych");
    const token = await getAccessToken();
    void pushWishlistChange(token, slug, added);
  }

  const heart = (
    <svg
      width={variant === "overlay" ? 18 : 20}
      height={variant === "overlay" ? 18 : 20}
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        aria-label={active ? `Usuń ${name} z ulubionych` : `Dodaj ${name} do ulubionych`}
        className={`tap inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border transition-colors ${
          active
            ? "border-coral bg-coral/10 text-coral"
            : "border-ink/20 text-ink hover:border-coral hover:text-coral"
        }`}
      >
        {heart}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? `Usuń ${name} z ulubionych` : `Dodaj ${name} do ulubionych`}
      className={`tap absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-line/60 bg-milk/90 shadow-sm backdrop-blur transition-colors ${
        active ? "text-coral" : "text-ash hover:text-coral"
      }`}
    >
      {heart}
    </button>
  );
}
