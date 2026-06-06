# Pan Kotecki — architektura (gotowy sklep + panel)

Cel: w pełni działający sklep z prawdziwą bazą, panelem zarządzania (aplikacja
desktopowa), płatnościami i dostawą.

## Elementy

```
┌──────────────────┐        ┌─────────────────────┐        ┌──────────────────┐
│  Sklep (Next.js) │  HTTP  │  Backend API        │  SQL   │  Supabase        │
│  Vercel          │ <────> │  Express + TS       │ <────> │  Postgres        │
│  pankotecki.pl   │        │  Render (Web Svc)   │        │  + Storage(zdj.) │
└──────────────────┘        └─────────────────────┘        └──────────────────┘
        ▲                            ▲
        │ płatność (redirect)        │ HTTP (token admina)
        ▼                            │
┌──────────────────┐        ┌─────────────────────┐
│  Stripe          │        │  Panel desktop      │
│  BLIK/P24/karta  │        │  Electron + React   │  (Twój komputer)
└──────────────────┘        └─────────────────────┘
```

- **Baza: Supabase** (Postgres) + **Storage** na zdjęcia produktów. Jedno źródło prawdy.
- **Backend: Render** — Express/TypeScript API. Jedyny, który zna `SERVICE_ROLE_KEY`
  (pełen dostęp do bazy). Obsługuje: katalog dla sklepu, składanie zamówień,
  płatności (Stripe + webhook), dostawy (InPost), oraz chronione endpointy dla panelu.
- **Sklep: Next.js (Vercel)** — czyta produkty z API, składa zamówienia, przekierowuje
  do płatności. (To, co już mamy, podpinamy pod API zamiast `lib/products.ts`.)
- **Panel: aplikacja desktopowa (Electron + React)** — logujesz się jako admin, masz
  pełne zarządzanie: produkty (dodawanie/edycja/usuwanie + zdjęcia), kategorie,
  promocje, zamówienia, klienci, podsumowanie sprzedaży, ustawienia.

## Rekomendacje (zdecydowane — można zmienić)

- **Płatności: Stripe.** Obsługuje **BLIK, Przelewy24 i karty** (czyli to, czego
  oczekują polscy klienci), ma najlepsze SDK, tryb testowy i webhooki — najszybciej
  uruchomimy działające płatności. Alternatywy PL-native: Przelewy24 / Tpay (gdyby
  zależało na najniższej prowizji — można podmienić później).
- **Dostawa: InPost** (Paczkomaty + Kurier) — standard w PL. W checkoucie wybór
  paczkomatu (Geowidget), w panelu generowanie etykiet i śledzenie (ShipX API).
- **Panel: Electron + React + Vite** — używamy tego samego stacku co sklep (React/
  Tailwind), więc szybko i spójnie; działa jako natywna apka na Windows/macOS.

## Bezpieczeństwo

- `SERVICE_ROLE_KEY` żyje **wyłącznie** w backendzie (Render env). Nigdy w sklepie
  ani w panelu.
- Panel loguje się do backendu (admin email+hasło → token JWT) i wywołuje chronione
  endpointy. Sklep używa tylko publicznych endpointów (katalog, złóż zamówienie).
- RLS w Supabase: publiczny odczyt tylko katalogu; reszta przez backend (service role).

## Pieniądze

Ceny trzymamy w **groszach (integer)** w bazie; API wystawia też wartość w zł.

## Struktura repo (wszystko w tym folderze)

```
kotecki.pl/
  app/ components/ lib/ ...   # sklep Next.js (Vercel)
  backend/                    # API Express (Render)
  admin/                      # panel Electron (lokalnie / build .exe)
  supabase/                   # schema.sql, policies.sql, seed
  docs/                       # ARCHITECTURE.md, SETUP.md (runbook)
```

## Etapy

1. Baza (schema) + backend katalog API. ← teraz
2. Migracja 20 produktów + podpięcie sklepu pod API.
3. Auth admina + pełne CRUD + upload zdjęć (Storage).
4. Panel desktop (Electron).
5. Płatności (Stripe + webhook + statusy zamówień).
6. Dostawa (InPost: paczkomat w checkoucie, etykiety w panelu).
7. SETUP.md: pełny runbook (konta, env vars, deploy).
