"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Product, Category } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { CATEGORY_PHOTOS } from "@/lib/photos";
import Paw from "@/components/ui/Paw";
import ProductCard from "./ProductCard";

const SORTS = [
  { key: "polecane", label: "Polecane" },
  { key: "cena-rosnaco", label: "Cena: od najniższej" },
  { key: "cena-malejaco", label: "Cena: od najwyższej" },
  { key: "nazwa", label: "Nazwa A–Z" },
];

type Props = {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
  initialSearch?: string;
};

export default function ShopClient({ products, categories, initialCategory, initialSearch }: Props) {
  const maxAll = useMemo(() => (products.length ? Math.max(...products.map((p) => p.price)) : 1000), [products]);

  const [cat, setCat] = useState(initialCategory ?? "wszystko");
  const [sort, setSort] = useState("polecane");
  const [maxPrice, setMaxPrice] = useState(maxAll);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [search, setSearch] = useState(initialSearch ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const counts = useMemo(() => {
    const map: Record<string, number> = { wszystko: products.length };
    for (const c of categories) map[c.slug] = products.filter((p) => p.category === c.slug).length;
    return map;
  }, [products, categories]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = products.filter((p) => {
      if (cat !== "wszystko" && p.category !== cat) return false;
      if (p.price > maxPrice) return false;
      if (onlyAvailable && !p.inStock) return false;
      if (term && !(`${p.name} ${p.shortDescription}`.toLowerCase().includes(term))) return false;
      return true;
    });
    switch (sort) {
      case "cena-rosnaco":
        list = list.sort((a, b) => a.price - b.price);
        break;
      case "cena-malejaco":
        list = list.sort((a, b) => b.price - a.price);
        break;
      case "nazwa":
        list = list.sort((a, b) => a.name.localeCompare(b.name, "pl"));
        break;
      default:
        list = list.sort((a, b) => Number(b.bestseller ?? false) - Number(a.bestseller ?? false));
    }
    return list;
  }, [products, cat, maxPrice, onlyAvailable, search, sort]);

  const resetFilters = () => {
    setCat("wszystko");
    setMaxPrice(maxAll);
    setOnlyAvailable(false);
    setSearch("");
  };

  const active = categories.find((c) => c.slug === cat);
  const activePhoto = active ? CATEGORY_PHOTOS[active.slug] : null;

  const Banner = active && activePhoto ? (
    <div className="relative flex min-h-[32vh] items-end overflow-hidden rounded-[2rem] md:min-h-[38vh]">
      <Image src={activePhoto.src} alt={activePhoto.alt} fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/10" />
      <div className="relative p-7 text-milk md:p-12">
        <p className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-milk/80">
          <Paw className="h-4 w-4 text-orange" />
          Kategoria
        </p>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{active.name}</h1>
        <p className="mt-2 max-w-md text-milk/85">{active.tagline}</p>
      </div>
    </div>
  ) : (
    <div className="relative overflow-hidden rounded-[2rem] bg-peach px-7 py-10 md:px-12 md:py-14">
      <div className="paw-pattern pointer-events-none absolute inset-0 opacity-[0.05]" />
      <div className="relative">
        <p className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-orange-deep">
          <Paw className="h-4 w-4" />
          Sklep
        </p>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Wszystko dla Twojego kota</h1>
        <p className="mt-3 max-w-lg text-ink-soft">
          Starannie wybrane zabawki, akcesoria, kubki i drobiazgi — same rzeczy,
          które dalibyśmy własnym kotom.
        </p>
      </div>
    </div>
  );

  const Sidebar = (
    <div className="flex flex-col gap-7">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Kategorie</h3>
        <ul className="flex flex-col gap-0.5 text-sm">
          {[{ slug: "wszystko", name: "Wszystko" }, ...categories].map((c) => (
            <li key={c.slug}>
              <button
                onClick={() => setCat(c.slug)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors ${
                  cat === c.slug ? "bg-ink text-milk" : "text-ink-soft hover:bg-cream"
                }`}
              >
                <span>{c.name}</span>
                <span className={cat === c.slug ? "text-milk/70" : "text-mist"}>{counts[c.slug] ?? 0}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Cena</h3>
        <input
          type="range"
          min={0}
          max={maxAll}
          step={5}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-coral"
          aria-label="Maksymalna cena"
        />
        <div className="mt-1 flex justify-between text-xs text-ash">
          <span>0 zł</span>
          <span>do {formatPrice(maxPrice)}</span>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Dostępność</h3>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            className="h-4 w-4 accent-coral"
          />
          Tylko dostępne
        </label>
      </div>

      <button onClick={resetFilters} className="self-start text-sm text-coral transition-colors hover:text-coral-deep">
        Wyczyść filtry
      </button>
    </div>
  );

  return (
    <>
      <section className="container-edge pt-2 md:pt-4">{Banner}</section>

      <div className="container-edge grid gap-8 pb-24 pt-8 md:pt-10 lg:grid-cols-[240px_1fr] lg:gap-10">
      <aside className="hidden lg:block">
        <div className="sticky top-32">{Sidebar}</div>
      </aside>

      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <p className="text-sm text-ash">
            {filtered.length}{" "}
            {filtered.length === 1 ? "produkt" : filtered.length < 5 ? "produkty" : "produktów"}
            {search.trim() && (
              <>
                {" "}dla „<span className="text-ink">{search.trim()}</span>"
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="rounded-lg border border-line bg-white px-4 py-2 text-sm lg:hidden"
            >
              Filtry
            </button>
            <label className="flex items-center gap-2 text-sm">
              <span className="hidden text-ash sm:inline">Sortuj:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition-colors hover:border-ink focus:border-ink"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {filtersOpen && (
          <div className="mb-6 rounded-xl border border-line bg-white p-5 lg:hidden">{Sidebar}</div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-lg font-medium">Brak produktów dla wybranych filtrów</p>
            <button onClick={resetFilters} className="rounded-lg bg-ink px-6 py-3 text-sm text-milk transition-colors hover:bg-coral">
              Wyczyść filtry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {filtered.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
