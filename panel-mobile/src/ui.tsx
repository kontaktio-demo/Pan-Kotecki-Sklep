import { useEffect, useState, type ReactNode } from "react";
import Icon from "./icons";

// ── Toasty (potwierdzenia akcji) ──────────────────────────────
type ToastItem = { id: number; message: string; tone: "ok" | "err" };
let toastListeners: ((items: ToastItem[]) => void)[] = [];
let toastItems: ToastItem[] = [];
let toastId = 1;

export function toast(message: string, tone: "ok" | "err" = "ok") {
  const id = toastId++;
  toastItems = [...toastItems, { id, message, tone }].slice(-3);
  toastListeners.forEach((l) => l(toastItems));
  setTimeout(() => {
    toastItems = toastItems.filter((t) => t.id !== id);
    toastListeners.forEach((l) => l(toastItems));
  }, 3000);
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    const l = (i: ToastItem[]) => setItems(i);
    toastListeners.push(l);
    return () => {
      toastListeners = toastListeners.filter((x) => x !== l);
    };
  }, []);
  if (items.length === 0) return null;
  return (
    <div
      aria-live="polite"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 86px)" }}
      className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-6"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium shadow-lg ${
            t.tone === "ok" ? "border-line bg-white text-ink" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Potwierdzenie akcji (zamiast window.confirm) ──────────────
export function ConfirmSheet({
  title,
  message,
  confirmLabel = "Potwierdź",
  danger = false,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-ink/40" onClick={onClose}>
      <div className="safe-bottom rounded-t-3xl bg-milk p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-base font-semibold">{title}</div>
        <p className="mt-1.5 text-sm text-ash">{message}</p>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Anuluj
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 rounded-xl px-4 py-3 font-semibold text-white active:scale-[0.98] ${
              danger ? "bg-red-600" : "bg-orange"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Spinner({ label = "Ładuję..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-20 text-ash">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-orange" />
      {label}
    </div>
  );
}

export function ErrorNote({ msg }: { msg: string }) {
  if (!msg) return null;
  return <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{msg}</div>;
}

export function Empty({ emoji = "🐾", title, hint }: { emoji?: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <div className="text-4xl">{emoji}</div>
      <div className="font-semibold">{title}</div>
      {hint && <div className="max-w-xs text-sm text-ash">{hint}</div>}
    </div>
  );
}

export function Fab({ onClick, label = "Dodaj" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 78px)" }}
      className="fixed right-4 z-30 flex items-center gap-2 rounded-full bg-orange px-5 py-3.5 font-semibold text-white shadow-lg shadow-orange/30 active:scale-95"
    >
      <Icon name="plus" size={20} />
      {label}
    </button>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: string }) {
  return <span className={`statuspill ${tone}`}>{label}</span>;
}

// Dolny arkusz (bottom sheet) - używany do edycji/podglądu. Czuć jak natywna appka.
export function Sheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/40" onClick={onClose}>
      <div
        className="mt-auto flex max-h-[94%] flex-col rounded-t-3xl bg-milk shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="text-base font-semibold">{title}</div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-cream text-ash">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="safe-bottom border-t border-line bg-white px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
