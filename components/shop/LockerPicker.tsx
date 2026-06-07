"use client";

import { useEffect, useRef, useState } from "react";

// Token Geowidgetu InPost (mapa paczkomatów). Z tokenem pokazujemy mapę z wyszukiwarką
// (jak Allegro/Zara). Bez tokenu - pole na kod paczkomatu jako fallback.
const TOKEN = process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN;

type Point = { name?: string; address?: { line1?: string; line2?: string }; address_details?: { street?: string } };

declare global {
  interface Window {
    __kotInpostPoint?: (p: Point) => void;
  }
}

export default function LockerPicker({
  value,
  label,
  onSelect,
}: {
  value: string;
  label: string;
  onSelect: (code: string, label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Rejestracja callbacku + załadowanie zasobów widgetu (raz).
  useEffect(() => {
    if (!TOKEN) return;
    const handlePoint = (p: Point) => {
      const code = (p?.name ?? "").toString();
      if (!code) return;
      const addr = p?.address?.line1 ?? p?.address_details?.street ?? "";
      onSelect(code, addr ? `${code} - ${addr}` : code);
      setOpen(false);
    };
    window.__kotInpostPoint = handlePoint;
    const onSel = (e: Event) => handlePoint((e as CustomEvent).detail as Point);
    document.addEventListener("onpointselect", onSel as EventListener);

    if (!document.getElementById("inpost-geo-css")) {
      const l = document.createElement("link");
      l.id = "inpost-geo-css";
      l.rel = "stylesheet";
      l.href = "https://geowidget.inpost.pl/inpost-geowidget.css";
      document.head.appendChild(l);
    }
    if (!document.getElementById("inpost-geo-js")) {
      const s = document.createElement("script");
      s.id = "inpost-geo-js";
      s.src = "https://geowidget.inpost.pl/inpost-geowidget.js";
      s.defer = true;
      s.onload = () => setReady(true);
      document.body.appendChild(s);
    } else {
      setReady(true);
    }

    return () => document.removeEventListener("onpointselect", onSel as EventListener);
  }, [onSelect]);

  // Mapę montujemy RĘCZNIE (document.createElement + setAttribute), NIE przez JSX/React -
  // bo `token` w elemencie to getter-only i React rzuca błędem przy ustawianiu właściwości.
  useEffect(() => {
    if (!open || !TOKEN) return;
    const host = mapRef.current;
    if (!host) return;
    let cancelled = false;

    const mount = () => {
      if (cancelled || !mapRef.current) return;
      mapRef.current.innerHTML = "";
      const el = document.createElement("inpost-geowidget");
      el.setAttribute("token", TOKEN);
      el.setAttribute("language", "pl");
      el.setAttribute("config", "parcelCollect");
      // onpoint = NAZWA globalnej funkcji (tak jak w oficjalnym przykładzie InPost)
      el.setAttribute("onpoint", "__kotInpostPoint");
      el.style.position = "absolute";
      el.style.inset = "0";
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.display = "block";
      mapRef.current.appendChild(el);
    };

    if (window.customElements?.get("inpost-geowidget")) mount();
    else window.customElements?.whenDefined("inpost-geowidget").then(mount).catch(() => {});

    return () => {
      cancelled = true;
      if (mapRef.current) mapRef.current.innerHTML = "";
    };
  }, [open]);

  return (
    <div className="flex flex-col gap-3">
      {value ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="text-2xl" aria-hidden="true">
            🐾
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-emerald-700">Twój paczkomat</div>
            <div className="truncate text-sm font-semibold">{label || value}</div>
          </div>
          {TOKEN && (
            <button type="button" onClick={() => setOpen(true)} className="shrink-0 text-sm font-semibold text-orange-deep">
              Zmień
            </button>
          )}
        </div>
      ) : TOKEN ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-orange/45 bg-peach/40 px-4 py-4 text-sm font-semibold text-orange-deep transition-colors hover:border-orange hover:bg-peach/70"
        >
          <span aria-hidden="true">📍</span> Wybierz paczkomat na mapie <span aria-hidden="true">🐾</span>
        </button>
      ) : null}

      {!TOKEN && (
        <div>
          <label className="mb-1 block text-xs font-medium text-ash">Kod paczkomatu</label>
          <input
            required
            value={value}
            onChange={(e) => onSelect(e.target.value.toUpperCase().trim(), e.target.value.toUpperCase().trim())}
            placeholder="np. WAW01M"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-orange"
          />
          <p className="mt-1 text-xs text-ash">
            Mapa paczkomatów 🐈 włączy się po dodaniu tokenu Geowidget (na Vercel).{" "}
            <a href="https://inpost.pl/znajdz-paczkomat" target="_blank" rel="noreferrer" className="underline">
              Znajdź kod
            </a>
          </p>
        </div>
      )}

      {open && TOKEN && (
        <div
          className="fixed inset-0 z-[130] flex items-end justify-center bg-ink/55 sm:items-center sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-milk shadow-2xl sm:h-[80vh] sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line bg-white px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-orange to-coral text-lg">🐾</span>
                <div>
                  <div className="font-semibold leading-tight">Gdzie ma czekać paczka?</div>
                  <div className="text-xs text-ash">Wyszukaj adres i kliknij paczkomat na mapie</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Zamknij"
                className="grid h-9 w-9 place-items-center rounded-full bg-cream text-ash hover:text-ink"
              >
                ✕
              </button>
            </div>
            <div className="relative flex-1">
              {!ready && (
                <div className="absolute inset-0 z-10 grid place-items-center text-ash">Ładuję mapę paczkomatów... 🐈</div>
              )}
              {/* mapę wstawia useEffect ręcznie (setAttribute) - patrz wyżej */}
              <div ref={mapRef} className="absolute inset-0" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
