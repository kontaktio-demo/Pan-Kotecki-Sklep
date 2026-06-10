import { resetConnection } from "../App";
import type { Page } from "../App";
import Icon from "../icons";

const ITEMS: { key: Page; label: string; icon: "tag" | "users" | "bell" | "settings" | "star"; desc: string }[] = [
  { key: "reviews", label: "Opinie", icon: "star", desc: "Moderacja opinii klientów" },
  { key: "categories", label: "Kategorie", icon: "tag", desc: "Działy sklepu" },
  { key: "promotions", label: "Promocje", icon: "tag", desc: "Kody rabatowe" },
  { key: "customers", label: "Klienci", icon: "users", desc: "Baza klientów" },
  { key: "notifications", label: "Powiadomienia", icon: "bell", desc: "Push przy zakupie" },
  { key: "settings", label: "Ustawienia", icon: "settings", desc: "Dostawa, ogłoszenie, kontakt" },
];

export default function More({ go }: { go: (p: Page) => void }) {
  return (
    <div className="space-y-3 p-4 pb-8">
      <div className="card divide-y divide-line overflow-hidden">
        {ITEMS.map((it) => (
          <button
            key={it.key}
            onClick={() => go(it.key)}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-cream/60"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-cream text-ink">
              <Icon name={it.icon} />
            </span>
            <span className="flex-1">
              <span className="block font-medium">{it.label}</span>
              <span className="block text-xs text-ash">{it.desc}</span>
            </span>
            <Icon name="chevron" className="text-ash" size={18} />
          </button>
        ))}
      </div>

      <button
        onClick={resetConnection}
        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 text-left active:bg-cream/60"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-cream text-ash">
          <Icon name="swap" />
        </span>
        <span className="flex-1">
          <span className="block font-medium">Zmień połączenie</span>
          <span className="block text-xs text-ash">Inny adres API / klucz</span>
        </span>
      </button>

      <p className="px-2 pt-2 text-center text-xs text-ash">Pan Kotecki - panel mobilny 🐾</p>
    </div>
  );
}
