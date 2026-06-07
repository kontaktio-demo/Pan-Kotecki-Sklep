"use client";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-line border-t-coral ${className}`}
      aria-label="Ładowanie"
    />
  );
}

export function CenterSpinner() {
  return (
    <div className="flex justify-center py-20">
      <Spinner className="h-7 w-7" />
    </div>
  );
}

export const ORDER_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "Oczekuje", tone: "bg-amber-100 text-amber-700" },
  paid: { label: "Opłacone", tone: "bg-mint text-teal-deep" },
  packed: { label: "Spakowane", tone: "bg-amber-100 text-amber-700" },
  shipped: { label: "Wysłane", tone: "bg-mint text-teal-deep" },
  delivered: { label: "Dostarczone", tone: "bg-mint text-teal-deep" },
  cancelled: { label: "Anulowane", tone: "bg-red-50 text-red-600" },
  refunded: { label: "Zwrócone", tone: "bg-cream text-ash" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = ORDER_STATUS[status] ?? { label: status, tone: "bg-cream text-ash" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${s.tone}`}>
      {s.label}
    </span>
  );
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ErrorNote({ msg }: { msg: string }) {
  return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{msg}</p>;
}
