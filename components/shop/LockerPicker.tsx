"use client";

import { createElement, useEffect, useState } from "react";

// Token Geowidgetu InPost (mapa paczkomatów). Gdy ustawiony — pokazujemy mapę.
// Bez tokenu działa samo pole z kodem paczkomatu (zawsze, jako źródło prawdy).
const TOKEN = process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN;

declare global {
  interface Window {
    __kotInpostPoint?: (p: { name?: string; address?: { line1?: string; line2?: string } }) => void;
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!TOKEN) return;
    window.__kotInpostPoint = (p) => {
      const code = (p?.name ?? "").toString();
      if (code) onSelect(code, p?.address?.line1 ? `${code} · ${p.address.line1}` : code);
    };
    const cssId = "inpost-geo-css";
    const jsId = "inpost-geo-js";
    if (!document.getElementById(cssId)) {
      const l = document.createElement("link");
      l.id = cssId;
      l.rel = "stylesheet";
      l.href = "https://geowidget.inpost.pl/inpost-geowidget.css";
      document.head.appendChild(l);
    }
    if (!document.getElementById(jsId)) {
      const s = document.createElement("script");
      s.id = jsId;
      s.src = "https://geowidget.inpost.pl/inpost-geowidget.js";
      s.defer = true;
      s.onload = () => setReady(true);
      document.body.appendChild(s);
    } else {
      setReady(true);
    }
  }, [onSelect]);

  return (
    <div className="flex flex-col gap-3">
      {TOKEN &&
        createElement("inpost-geowidget" as never, {
          token: TOKEN,
          language: "pl",
          config: "parcelCollect",
          onpoint: "__kotInpostPoint",
          style: { display: "block", width: "100%", height: 420, borderRadius: 12, overflow: "hidden" },
        } as never)}
      {TOKEN && !ready && <p className="text-xs text-ash">Ładuję mapę paczkomatów…</p>}

      <div>
        <label className="mb-1 block text-xs font-medium text-ash">Kod paczkomatu</label>
        <input
          required
          value={value}
          onChange={(e) => onSelect(e.target.value.toUpperCase().trim(), e.target.value.toUpperCase().trim())}
          placeholder="np. LOD01M"
          className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink"
        />
        {label && value && <p className="mt-1 text-xs text-emerald-700">Wybrano: {label}</p>}
        {!TOKEN && (
          <p className="mt-1 text-xs text-ash">
            Nie znasz kodu?{" "}
            <a href="https://inpost.pl/znajdz-paczkomat" target="_blank" rel="noreferrer" className="underline">
              Znajdź paczkomat na mapie InPost
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}
