import { useEffect, useState } from "react";
import { api } from "../api";
import { zl } from "../format";
import { Spinner, ErrorNote } from "../ui";
import Icon from "../icons";
import type { Page } from "../App";

type Monthly = {
  monthLabel: string;
  thisRevenueGrosze: number;
  lastRevenueGrosze: number;
  changePct: number;
  ordersCount: number;
  itemsSold: number;
  newCustomers: number;
  avgOrderGrosze: number;
  bestDay: { date: string; grosze: number };
  topProduct: { name: string; qty: number } | null;
  daily: { date: string; grosze: number }[];
  byMonth: { label: string; grosze: number }[];
  goal: { goalGrosze: number; progress: number; beatLast: boolean };
};

function plDay(date: string) {
  try {
    return new Date(date).toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
  } catch {
    return date;
  }
}

const QUICK: { key: Page; label: string; icon: "orders" | "products" | "tag" | "stats"; tone: string }[] = [
  { key: "orders", label: "Zamówienia", icon: "orders", tone: "bg-orange/15 text-orange-deep" },
  { key: "products", label: "Produkty", icon: "products", tone: "bg-coral/15 text-coral" },
  { key: "promotions", label: "Promocje", icon: "tag", tone: "bg-emerald-100 text-emerald-700" },
  { key: "stats", label: "Pulpit", icon: "stats", tone: "bg-sky-100 text-sky-700" },
];

export default function Home({ go }: { go: (p: Page) => void }) {
  const [d, setD] = useState<Monthly | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/api/admin/stats/monthly").then(setD).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="p-4"><ErrorNote msg={`Błąd: ${err}`} /></div>;
  if (!d) return <Spinner label="Liczę Twoje zarobki..." />;

  const up = d.changePct >= 0;
  const headline =
    d.changePct >= 50 ? "🚀 Mocno w górę!" : d.changePct > 0 ? "🔥 Rośniesz!" : d.changePct === 0 ? "✨ Działamy dalej!" : "💪 Dasz radę nadrobić!";
  const remaining = Math.max(0, d.goal.goalGrosze - d.thisRevenueGrosze);
  const goalMsg = remaining === 0 ? "Cel osiągnięty! 🎉" : `Jeszcze ${zl(remaining)} do celu - lecimy!`;
  const maxMonth = Math.max(1, ...d.byMonth.map((x) => x.grosze));
  const maxDay = Math.max(1, ...d.daily.map((x) => x.grosze));

  const kpis = [
    { label: "Zamówienia", value: d.ordersCount, icon: "📦" },
    { label: "Sprzedane sztuki", value: d.itemsSold, icon: "🛍️" },
    { label: "Nowi klienci", value: d.newCustomers, icon: "🐾" },
    { label: "Śr. zamówienie", value: zl(d.avgOrderGrosze), icon: "💸" },
  ];

  return (
    <div className="space-y-5 p-4 pb-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange to-coral p-6 text-white shadow-lg shadow-orange/25">
        <div className="pointer-events-none absolute -right-2 top-1 text-7xl opacity-20 select-none">🐱</div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
          Zarobione - {d.monthLabel}
        </div>
        <div className="mt-1.5 text-[2.6rem] font-bold leading-none tabular-nums">{zl(d.thisRevenueGrosze)}</div>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[13px] backdrop-blur">
          {d.lastRevenueGrosze > 0
            ? `${up ? "▲ +" : "▼ "}${d.changePct}% vs poprzedni miesiąc`
            : "Pierwszy miesiąc - robimy historię!"}
        </div>
        <div className="mt-3 text-lg font-semibold">{headline}</div>
      </div>

      {/* Szybkie akcje */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK.map((q) => (
          <button key={q.key} onClick={() => go(q.key)} className="flex flex-col items-center gap-1.5">
            <span className={`grid h-14 w-full place-items-center rounded-2xl ${q.tone}`}>
              <Icon name={q.icon} size={24} />
            </span>
            <span className="text-[11px] font-medium text-ash">{q.label}</span>
          </button>
        ))}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <div className="text-xl">{k.icon}</div>
            <div className="mt-1.5 text-xl font-bold tabular-nums">{k.value}</div>
            <div className="text-xs text-ash">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Cel */}
      <div className="card p-5">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-semibold">🎯 {d.goal.beatLast ? "Pobij poprzedni miesiąc" : "Następny kamień milowy"}</span>
          <span className="text-ash tabular-nums">{zl(d.goal.goalGrosze)}</span>
        </div>
        <div className="mt-3 h-3.5 overflow-hidden rounded-full bg-cream">
          <div className="h-full rounded-full bg-gradient-to-r from-orange to-coral transition-all" style={{ width: `${d.goal.progress}%` }} />
        </div>
        <div className="mt-2 text-sm text-ash">{goalMsg}</div>
      </div>

      {/* Najlepszy dzień / hit */}
      <div className="grid grid-cols-1 gap-3">
        <div className="card flex items-center gap-3 p-4">
          <div className="text-2xl">🗓️</div>
          <div>
            <div className="text-xs text-ash">Najlepszy dzień</div>
            <div className="font-semibold">
              {d.bestDay.grosze > 0 ? `${plDay(d.bestDay.date)} - ${zl(d.bestDay.grosze)}` : "Jeszcze przed Tobą 😉"}
            </div>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <div className="text-2xl">🏅</div>
          <div>
            <div className="text-xs text-ash">Hit miesiąca</div>
            <div className="font-semibold">
              {d.topProduct ? `${d.topProduct.name} (${d.topProduct.qty} szt.)` : "Brak sprzedaży - to się zmieni!"}
            </div>
          </div>
        </div>
      </div>

      {/* Wykres 6 miesięcy */}
      <div className="card p-5">
        <div className="mb-4 text-sm font-semibold">Przychód - 6 miesięcy</div>
        <div className="flex h-36 items-end gap-2.5">
          {d.byMonth.map((mn, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-md bg-orange/70"
                style={{ height: `${Math.max(3, Math.round((mn.grosze / maxMonth) * 100))}%` }}
              />
              <div className="text-[10px] capitalize text-ash">{mn.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dzień po dniu */}
      <div className="card p-5">
        <div className="mb-4 text-sm font-semibold">Ten miesiąc - dzień po dniu</div>
        <div className="flex h-28 items-end gap-0.5">
          {d.daily.map((x) => (
            <div
              key={x.date}
              className="flex-1 rounded-t bg-coral/70"
              style={{ height: `${Math.max(3, Math.round((x.grosze / maxDay) * 100))}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
