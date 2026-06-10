"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";

// Wyszukiwarka z podpowiedziami na żywo (debounce 250 ms, klawiatura: ↑↓ Enter Esc).
// Bez backendu degraduje się do zwykłego "wpisz i Enter".
const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

type Suggestion = {
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  image: string | null;
};

export default function SearchAutocomplete({ onNavigate, className = "" }: { onNavigate: () => void; className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // podpowiedzi (debounce)
  useEffect(() => {
    if (!API || q.trim().length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/products/suggest?q=${encodeURIComponent(q.trim())}`);
        if (!res.ok) return;
        const data = (await res.json()) as Suggestion[];
        setItems(data);
        setOpen(data.length > 0);
        setActive(-1);
      } catch {
        /* sieć padła - zwykłe wyszukiwanie dalej działa */
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  // zamknij dropdown przy kliknięciu poza
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function goTo(slug?: string) {
    setOpen(false);
    if (slug) {
      router.push(`/sklep/${slug}`);
    } else {
      router.push(q.trim() ? `/sklep?szukaj=${encodeURIComponent(q.trim())}` : "/sklep");
    }
    onNavigate();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter" && active >= 0 && items[active]) {
      e.preventDefault();
      goTo(items[active].slug);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goTo();
        }}
        className="flex items-center overflow-hidden rounded-lg border border-line bg-white focus-within:border-ink"
        role="search"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => items.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Czego szuka Twój kot?"
          aria-label="Szukaj produktów"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-suggestions"
          aria-activedescendant={active >= 0 ? `suggestion-${active}` : undefined}
          autoComplete="off"
          className="w-full bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-mist"
        />
        <button type="submit" className="flex h-full items-center px-4 text-ash transition-colors hover:text-coral" aria-label="Szukaj">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </form>

      {open && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-line bg-white shadow-[0_24px_48px_-24px_rgba(20,14,6,0.35)]"
        >
          {items.map((s, i) => (
            <li key={s.slug} role="option" id={`suggestion-${i}`} aria-selected={i === active}>
              <button
                type="button"
                onClick={() => goTo(s.slug)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                  i === active ? "bg-cream" : "hover:bg-cream/60"
                }`}
              >
                <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-cream">
                  {s.image && <Image src={s.image} alt="" fill sizes="40px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatPrice(s.salePrice ?? s.price)}
                </span>
              </button>
            </li>
          ))}
          <li className="border-t border-line">
            <button
              type="button"
              onClick={() => goTo()}
              className="block w-full px-3.5 py-2.5 text-left text-sm font-medium text-coral transition-colors hover:bg-cream/60"
            >
              Pokaż wszystkie wyniki dla &bdquo;{q.trim()}&rdquo;
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
