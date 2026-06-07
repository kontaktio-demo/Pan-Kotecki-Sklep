"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/account/AuthProvider";
import { CenterSpinner, StatusBadge, formatDate, ErrorNote } from "@/components/account/ui";
import { getOrders, type AccountOrder } from "@/lib/account";
import { formatPrice } from "@/lib/format";

export default function ZamowieniaPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<AccountOrder[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (loading || !user) return;
    getOrders().then(setOrders).catch((e) => { setErr(e.message); setOrders([]); });
  }, [user, loading]);

  if (loading || !user || orders === null) return <CenterSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-semibold md:text-3xl">Zamówienia</h1>
      <p className="mt-2 text-ink-soft">Historia Twoich zakupów w Pan Kotecki.</p>

      {err && <div className="mt-5"><ErrorNote msg={err} /></div>}

      {orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/60 p-10 text-center">
          <span className="text-4xl" aria-hidden="true">🐾</span>
          <p className="mt-3 font-medium">Nie masz jeszcze żadnych zamówień</p>
          <p className="mt-1 text-sm text-ash">Gdy coś zamówisz, pojawi się tutaj — razem ze statusem wysyłki.</p>
          <Link href="/sklep" className="tap mt-5 inline-flex rounded-xl bg-ink px-6 py-3 text-sm text-milk hover:bg-coral">
            Przejdź do sklepu
          </Link>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {orders.map((o) => (
            <li key={o.number}>
              <Link
                href={`/konto/zamowienia/${o.number}`}
                className="tap block rounded-2xl border border-line bg-white p-5 hover:border-ink/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold">{o.number}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <span className="font-semibold tabular-nums">{formatPrice(o.total)}</span>
                </div>
                <p className="mt-1 text-sm text-ash">
                  {formatDate(o.createdAt)} · {o.itemCount} {o.itemCount === 1 ? "produkt" : "szt."}
                </p>
                <p className="mt-2 truncate text-sm text-ink-soft">
                  {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
