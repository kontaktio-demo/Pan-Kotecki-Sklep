import { useEffect, useState } from "react";
import { loadConfig, saveConfig } from "./config";
import { setCfg } from "./api";
import { refreshPushSilently, unsubscribePush } from "./push";
import type { PanelConfig } from "./global";
import Icon from "./icons";

import Setup from "./pages/Setup";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Stats from "./pages/Stats";
import More from "./pages/More";
import Categories from "./pages/Categories";
import Promotions from "./pages/Promotions";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";

export type Page =
  | "home"
  | "orders"
  | "products"
  | "stats"
  | "more"
  | "categories"
  | "promotions"
  | "customers"
  | "settings"
  | "notifications";

const TITLES: Record<Page, string> = {
  home: "Podsumowanie",
  orders: "Zamówienia",
  products: "Produkty",
  stats: "Pulpit",
  more: "Więcej",
  categories: "Kategorie",
  promotions: "Promocje",
  customers: "Klienci",
  settings: "Ustawienia",
  notifications: "Powiadomienia",
};

const SUBPAGES: Page[] = ["categories", "promotions", "customers", "settings", "notifications"];

const TABS: { key: Page; label: string; icon: "home" | "orders" | "products" | "stats" | "more" }[] = [
  { key: "home", label: "Start", icon: "home" },
  { key: "orders", label: "Zamówienia", icon: "orders" },
  { key: "products", label: "Produkty", icon: "products" },
  { key: "stats", label: "Pulpit", icon: "stats" },
  { key: "more", label: "Więcej", icon: "more" },
];

export default function App() {
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [page, setPage] = useState<Page>("home");

  useEffect(() => {
    const c = loadConfig();
    if (c.apiUrl && c.key) {
      setCfg(c);
      setConfigured(true);
      refreshPushSilently();
    }
    setReady(true);
  }, []);

  // jeśli appkę otwarto z kliknięcia w powiadomienie (#orders) → idź do zamówień
  useEffect(() => {
    if (configured && window.location.hash.includes("orders")) setPage("orders");
  }, [configured]);

  // gdy apka jest już otwarta, service worker po kliknięciu powiadomienia
  // wysyła wiadomość - przełączamy zakładkę (sama zmiana #hash nie odpala Reacta).
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMsg = (e: MessageEvent) => {
      const nav = (e.data as { nav?: string })?.nav;
      if (nav === "orders" || nav === "home") setPage(nav as Page);
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, []);

  if (!ready) return <div className="grid h-full place-items-center text-ash">Ładowanie...</div>;

  if (!configured) {
    return (
      <Setup
        onDone={(c: PanelConfig) => {
          setCfg(c);
          setConfigured(true);
          refreshPushSilently();
        }}
      />
    );
  }

  const go = (p: Page) => setPage(p);
  const isSub = SUBPAGES.includes(page);
  const activeTab: Page = isSub ? "more" : page;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-milk">
      {/* Górny pasek */}
      <header className="safe-top z-20 shrink-0 border-b border-line bg-white">
        <div className="flex h-14 items-center gap-2 px-4">
          {isSub ? (
            <button onClick={() => go("more")} className="-ml-2 grid h-9 w-9 place-items-center rounded-full text-ink active:bg-cream">
              <Icon name="back" />
            </button>
          ) : (
            <span className="text-lg">🐾</span>
          )}
          <h1 className="flex-1 text-lg font-bold tracking-tight">
            {page === "home" ? (
              <>
                Pan Kotecki<span className="text-orange">.</span>
              </>
            ) : (
              TITLES[page]
            )}
          </h1>
          <button
            onClick={() => go("notifications")}
            className="grid h-9 w-9 place-items-center rounded-full text-ink active:bg-cream"
            aria-label="Powiadomienia"
          >
            <Icon name="bell" size={21} />
          </button>
        </div>
      </header>

      {/* Treść */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {page === "home" && <Home go={go} />}
        {page === "orders" && <Orders />}
        {page === "products" && <Products />}
        {page === "stats" && <Stats />}
        {page === "more" && <More go={go} />}
        {page === "categories" && <Categories />}
        {page === "promotions" && <Promotions />}
        {page === "customers" && <Customers />}
        {page === "settings" && <Settings />}
        {page === "notifications" && <Notifications />}
      </main>

      {/* Dolny pasek zakładek */}
      <nav className="safe-bottom z-20 shrink-0 border-t border-line bg-white">
        <div className="flex">
          {TABS.map((t) => {
            const on = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => go(t.key)}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  on ? "text-orange-deep" : "text-ash"
                }`}
              >
                <Icon name={t.icon} size={23} strokeWidth={on ? 2.4 : 2} />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// szybkie przełączenie połączenia (używane w „Więcej")
export async function resetConnection() {
  if (confirm("Zmienić połączenie? Trzeba będzie wpisać adres i klucz ponownie.")) {
    await unsubscribePush(); // żeby to urządzenie przestało dostawać powiadomienia
    saveConfig({});
    location.reload();
  }
}
