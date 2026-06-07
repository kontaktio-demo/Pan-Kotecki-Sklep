export function zl(grosze: number | null | undefined): string {
  const v = (grosze ?? 0) / 100;
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v);
}

export function toGrosze(zlValue: string | number): number {
  const n = typeof zlValue === "string" ? parseFloat(zlValue.replace(",", ".")) : zlValue;
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function fromGrosze(grosze: number | null | undefined): string {
  return ((grosze ?? 0) / 100).toFixed(2);
}

export function dateStr(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function dateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Oczekuje",
  paid: "Opłacone",
  packed: "Spakowane",
  shipped: "Wysłane",
  delivered: "Dostarczone",
  cancelled: "Anulowane",
  refunded: "Zwrot",
};

export const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Nieopłacone",
  paid: "Opłacone",
  failed: "Nieudane",
  refunded: "Zwrócone",
};

// kolory statusów (Tailwind klasy) — spójne, czytelne pigułki
export const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  packed: "bg-sky-100 text-sky-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-cream text-ash",
  refunded: "bg-cream text-ash",
};
