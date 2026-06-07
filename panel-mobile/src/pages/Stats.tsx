import { useEffect, useState } from "react";
import { api } from "../api";
import { zl } from "../format";
import { Spinner, ErrorNote } from "../ui";

type Stats = {
  revenueGrosze: number;
  ordersCount: number;
  paidCount: number;
  pendingCount: number;
  shippedCount: number;
  productsCount: number;
  customersCount: number;
  avgOrderGrosze: number;
  revenueByDay: { date: string; grosze: number }[];
  recentOrders: { id: string; number: string; email: string; total_grosze: number; status: string }[];
  topProducts: { name: string; qty: number; revenueGrosze: number }[];
};

export default function StatsPage() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/api/admin/stats").then(setS).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="p-4"><ErrorNote msg={`Błąd: ${err}`} /></div>;
  if (!s) return <Spinner />;

  const max = Math.max(1, ...s.revenueByDay.map((d) => d.grosze));
  const kpis = [
    { label: "Przychód (opłacone)", value: zl(s.revenueGrosze) },
    { label: "Śr. zamówienie", value: zl(s.avgOrderGrosze) },
    { label: "Zamówienia", value: s.ordersCount },
    { label: "Do realizacji", value: s.pendingCount },
    { label: "Produkty", value: s.productsCount },
    { label: "Klienci", value: s.customersCount },
  ];

  return (
    <div className="space-y-5 p-4 pb-8">
      <div className="grid grid-cols-2 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <div className="text-xs text-ash">{k.label}</div>
            <div className="mt-1 text-xl font-bold tabular-nums">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="mb-4 text-sm font-semibold">Przychód — ostatnie 30 dni</div>
        <div className="flex h-32 items-end gap-0.5">
          {s.revenueByDay.map((d) => (
            <div
              key={d.date}
              className="flex-1 rounded-t bg-orange/70"
              style={{ height: `${Math.max(3, Math.round((d.grosze / max) * 100))}%` }}
            />
          ))}
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-3 text-sm font-semibold">Ostatnie zamówienia</div>
        {s.recentOrders.length === 0 ? (
          <p className="text-sm text-ash">Brak zamówień.</p>
        ) : (
          <div className="divide-y divide-line">
            {s.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium">{o.number}</span>
                <span className="truncate px-2 text-ash">{o.email}</span>
                <span className="tabular-nums">{zl(o.total_grosze)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="mb-3 text-sm font-semibold">Najlepiej sprzedające się</div>
        {s.topProducts.length === 0 ? (
          <p className="text-sm text-ash">Brak danych (jeszcze nie było opłaconych zamówień).</p>
        ) : (
          <div className="divide-y divide-line">
            {s.topProducts.map((t) => (
              <div key={t.name} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <span className="truncate">{t.name}</span>
                <span className="shrink-0 text-ash">{t.qty} szt.</span>
                <span className="shrink-0 tabular-nums">{zl(t.revenueGrosze)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
