"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "./Logo";
import { useCart, cartCount } from "@/store/cart";

const CATEGORIES = [
  { href: "/sklep", label: "Wszystko" },
  { href: "/sklep?kategoria=zabawki", label: "Zabawki" },
  { href: "/sklep?kategoria=akcesoria", label: "Akcesoria" },
  { href: "/sklep?kategoria=kubki", label: "Kubki" },
  { href: "/sklep?kategoria=dla-wlasciciela", label: "Dla właściciela" },
];

function SearchForm({ onSubmit, className = "" }: { onSubmit: () => void; className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/sklep?szukaj=${encodeURIComponent(q.trim())}` : "/sklep");
        onSubmit();
      }}
      className={`flex items-center overflow-hidden rounded-lg border border-line bg-white focus-within:border-ink ${className}`}
      role="search"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Czego szuka Twój kot?"
        aria-label="Szukaj produktów"
        className="w-full bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-mist"
      />
      <button type="submit" className="flex h-full items-center px-4 text-ash transition-colors hover:text-coral" aria-label="Szukaj">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}

export default function Header() {
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.open);
  const bump = useCart((s) => s.bump);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const count = mounted ? cartCount(items) : 0;

  return (
    <header className="sticky top-0 z-[120] border-b border-line bg-milk/95 backdrop-blur-md">
      <div className="container-edge flex h-16 items-center gap-4">
        <Link href="/" aria-label="Pan Kotecki — strona główna" className="shrink-0">
          <Logo />
        </Link>

        <SearchForm onSubmit={() => {}} className="hidden flex-1 md:flex" />

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            href="/kontakt"
            className="hidden rounded-lg px-3 py-2 text-sm text-ink-soft transition-colors hover:text-coral lg:block"
          >
            Pomoc
          </Link>
          <button
            onClick={openCart}
            className="relative inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm transition-colors hover:border-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 4h2l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.2L20.5 8H6.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9.5" cy="20" r="1.4" fill="currentColor" />
              <circle cx="17.5" cy="20" r="1.4" fill="currentColor" />
            </svg>
            <span className="hidden sm:inline">Koszyk</span>
            {count > 0 && (
              <span
                key={bump}
                className={`absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1 text-[0.7rem] font-semibold text-white tabular-nums ${
                  bump > 0 ? "animate-bump" : ""
                }`}
              >
                {count}
              </span>
            )}
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white md:hidden"
            aria-label="Menu"
          >
            <span className="relative block h-3 w-4">
              <span className={`absolute left-0 block h-0.5 w-4 bg-ink transition-all ${menuOpen ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute bottom-0 left-0 block h-0.5 w-4 bg-ink transition-all ${menuOpen ? "bottom-1 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      <nav className="hidden border-t border-line md:block">
        <div className="container-edge flex h-11 items-center gap-6 text-sm">
          {CATEGORIES.map((c) => (
            <Link key={c.label} href={c.href} className="text-ink-soft transition-colors hover:text-coral">
              {c.label}
            </Link>
          ))}
          <span className="ml-auto text-xs text-ash">Darmowa dostawa od 149 zł · Wysyłka 24h</span>
        </div>
      </nav>

      {menuOpen && (
        <div className="min-h-[calc(100dvh-4rem)] border-t border-line bg-milk px-[clamp(1.25rem,4vw,4rem)] py-6 md:hidden">
          <SearchForm onSubmit={() => setMenuOpen(false)} className="mb-4" />
          <nav className="flex flex-col">
            {CATEGORIES.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-line py-3 text-base"
              >
                {c.label}
              </Link>
            ))}
            <Link href="/o-nas" onClick={() => setMenuOpen(false)} className="border-b border-line py-3 text-base">
              O nas
            </Link>
            <Link href="/kontakt" onClick={() => setMenuOpen(false)} className="py-3 text-base">
              Kontakt
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
