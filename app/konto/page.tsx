"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/account/AuthProvider";
import { CenterSpinner, StatusBadge, formatDate } from "@/components/account/ui";
import { getProfile, getOrders, type AccountOrder } from "@/lib/account";
import { formatPrice } from "@/lib/format";

export default function KontoOverview() {
  const { user, loading } = useAuth();
  const [name, setName] = useState("");
  const [orders, setOrders] = useState<AccountOrder[] | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    getProfile().then((p) => setName(p.full_name)).catch(() => {});
    getOrders().then(setOrders).catch(() => setOrders([]));
  }, [user, loading]);

  if (loading || !user) return <CenterSpinner />;

  const hello = name ? name.split(" ")[0] : "Cześć";
  const recent = (orders ?? []).slice(0, 3);

  return (
    <div>
      <h1 className="text-2xl font-semibold md:text-3xl">{name ? `Cześć, ${hello} 🐾` : "Witaj 🐾"}</h1>
      <p className="mt-2 text-ink-soft">Tu znajdziesz swoje zamówienia, adresy i dane konta.</p>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <Link href="/konto/zamowienia" className="tap rounded-2xl border border-line bg-white p-5 hover:border-ink/30">
          <p className="text-sm text-ash">Zamówienia</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{orders ? orders.length : "-"}</p>
        </Link>
        <Link href="/konto/adresy" className="tap rounded-2xl border border-line bg-white p-5 hover:border-ink/30">
          <p className="text-sm text-ash">Adresy</p>
          <p className="mt-1 text-base font-medium">Książka adresowa →</p>
        </Link>
        <Link href="/konto/dane" className="tap rounded-2xl border border-line bg-white p-5 hover:border-ink/30">
          <p className="text-sm text-ash">Dane konta</p>
          <p className="mt-1 text-base font-medium">Edytuj profil →</p>
        </Link>
      </div>

      <div className="mt-9 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ostatnie zamówienia</h2>
        {recent.length > 0 && (
          <Link href="/konto/zamowienia" className="text-sm font-medium text-coral hover:text-coral-deep">
            Wszystkie →
          </Link>
        )}
      </div>

      {orders === null ? (
        <CenterSpinner />
      ) : recent.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-white/60 p-8 text-center">
          <p className="font-medium">Brak zamówień - na razie.</p>
          <p className="mt-1 text-sm text-ash">Twój kot na pewno coś sobie upatrzył.</p>
          <Link href="/sklep" className="tap mt-5 inline-flex rounded-xl bg-ink px-6 py-3 text-sm text-milk hover:bg-coral">
            Przejdź do sklepu
          </Link>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {recent.map((o) => (
            <li key={o.number}>
              <Link
                href={`/konto/zamowienia/${o.number}`}
                className="tap flex items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4 hover:border-ink/30"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{o.number}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ash">
                    {formatDate(o.createdAt)} - {o.itemCount} {o.itemCount === 1 ? "produkt" : "szt."}
                  </p>
                </div>
                <span className="shrink-0 font-semibold tabular-nums">{formatPrice(o.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
