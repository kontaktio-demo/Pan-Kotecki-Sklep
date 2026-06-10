"use client";

import { ORDER_STATUS } from "@/components/account/ui";

// Oś czasu zamówienia: złożone → opłacone → spakowane → wysłane → dostarczone.
// Daty z order_status_history; anulowane/zwrócone jako węzeł końcowy.
const FLOW = ["pending", "paid", "packed", "shipped", "delivered"] as const;
const TERMINAL = new Set(["cancelled", "refunded"]);

export type HistoryEntry = { status: string; at: string };

function fmt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pl-PL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default function OrderTimeline({ status, history }: { status: string; history: HistoryEntry[] }) {
  const dates = new Map<string, string>();
  for (const h of history) {
    if (!dates.has(h.status)) dates.set(h.status, h.at);
  }
  const terminal = TERMINAL.has(status) ? status : null;
  const currentIdx = terminal
    ? FLOW.findIndex((s) => !dates.has(s)) - 1
    : FLOW.indexOf(status as (typeof FLOW)[number]);
  const reachedIdx = terminal ? Math.max(currentIdx, 0) : currentIdx;

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="mb-4 text-sm font-medium">Status zamówienia</p>
      <ol className="relative space-y-0">
        {FLOW.map((step, i) => {
          const done = !terminal && i <= reachedIdx;
          const isLast = i === FLOW.length - 1;
          const date = dates.get(step);
          const skipRest = terminal && i > reachedIdx;
          if (skipRest) return null;
          return (
            <li key={step} className="relative flex gap-3 pb-5 last:pb-0">
              {!(isLast || (terminal && i === reachedIdx)) && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[9px] top-6 h-[calc(100%-12px)] w-0.5 ${done && i < reachedIdx ? "bg-teal" : "bg-line"}`}
                />
              )}
              <span
                className={`relative z-10 mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  done ? "border-teal bg-teal text-white" : "border-line bg-white"
                }`}
              >
                {done && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                )}
              </span>
              <span className="min-w-0">
                <span className={`block text-sm ${done ? "font-medium text-ink" : "text-ash"}`}>
                  {ORDER_STATUS[step]?.label ?? step}
                </span>
                {date && done && <span className="block text-xs text-mist">{fmt(date)}</span>}
              </span>
            </li>
          );
        })}
        {terminal && (
          <li className="relative flex gap-3">
            <span className="relative z-10 mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-red-300 bg-red-50 text-red-500">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </span>
            <span>
              <span className="block text-sm font-medium text-red-600">{ORDER_STATUS[terminal]?.label ?? terminal}</span>
              {dates.get(terminal) && <span className="block text-xs text-mist">{fmt(dates.get(terminal)!)}</span>}
            </span>
          </li>
        )}
      </ol>
    </div>
  );
}
