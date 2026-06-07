import type { ReactNode } from "react";
import Icon from "./icons";

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
