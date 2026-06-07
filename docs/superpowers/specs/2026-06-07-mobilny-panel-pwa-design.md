# Mobilny panel Pan Kotecki — PWA na iOS (design)

Data: 2026-06-07

## Cel
Mobilna wersja panelu zarządzania sklepem dla **dwóch właścicieli** (tylko iOS),
wyglądająca i działająca tak jak panel desktopowy (te same kolory, kafelki, styl),
ze wszystkimi funkcjami panelu i **niezawodnymi powiadomieniami push przy każdym zakupie**.

## Dlaczego PWA
- Własna ikona na ekranie, tryb standalone (bez paska przeglądarki) — wygląda jak natywna apka.
- Darmowe (Vercel), bez konta Apple Developer, bez App Store.
- Instalacja dla 2 osób: link → Safari → „Do ekranu głównego”.
- Push działa na iOS 16.4+ (Web Push / APNs pod spodem).
- Native (Expo+TestFlight) odrzucone: koszt 99 USD/rok, niepotrzebny dla 2 osób.

## Stack
- **Vite + React + TypeScript + Tailwind** (te same tokeny i klasy co panel desktopowy).
- **vite-plugin-pwa** (Workbox, strategia injectManifest) — manifest + service worker z obsługą push.
- Hosting: **Vercel** (osobny projekt, Root Directory = `panel-mobile`), w repo sklepu jako podfolder
  (źródło nie zawiera sekretów — klucz admina wpisuje użytkownik w przeglądarce).
- Backend bez zmian architektury: ten sam Render + `x-admin-key`.

## Architektura
```
panel-mobile (PWA, Vercel)  ──x-admin-key──►  backend (Render)  ──►  Supabase
        │                                          │
   service worker (push)  ◄──Web Push (VAPID)──  web-push (na nowe zamówienie)
```
- Konfiguracja (adres API + klucz) w `localStorage` (zamiast Electron IPC).
- Layout mobile-first: **dolny pasek zakładek** zamiast bocznego menu, duże cele dotyku, kafelki.

## Funkcje (parytet z desktopem)
🎉 Podsumowanie miesiąca · Pulpit · Produkty (+zdjęcia, upload→WebP) · Kategorie ·
Promocje · Zamówienia (statusy, etykiety InPost, PDF) · Klienci · Ustawienia.
Wszystko, co można na kompie, można z telefonu.

## Powiadomienia push (priorytet: niezawodność)
- **Klucze VAPID** (env na Render): `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
- Tabela `push_subscriptions` (endpoint + klucze).
- Endpointy admina: `GET /api/admin/push/public-key`, `POST /api/admin/push/subscribe`,
  `POST /api/admin/push/test`.
- Wysyłka **TYLKO dla opłaconych zamówień** — w momencie gdy `payment_status` → `paid`:
  - Stripe potwierdza płatność (webhook),
  - lub właściciel oznacza zamówienie jako opłacone w panelu (odbiór/gotówka).
  Treść: „🛒 Opłacone zamówienie PK-XXXX — 128 zł”. Brak push dla niezapłaconych.
- Niezawodność: apka **odnawia subskrypcję przy każdym otwarciu** i wysyła ją na backend;
  backend **kasuje martwe subskrypcje** (404/410) przy wysyłce; payload minimalny.
- Uczciwie: Web Push na iOS jest bardzo dobry, ale nie 100% jak natywny APNs; powyższe
  zabiegi maksymalizują dostarczalność dla 2 aktywnych właścicieli.

## Backend — co dochodzi
- Dependency `web-push`.
- `lib/push.ts` (init VAPID, `sendPushToAll(title, body, url)` z czyszczeniem martwych subów).
- `routes/admin/push.ts` (public-key / subscribe / test).
- Tabela `push_subscriptions` w SQL (RLS on, tylko service_role).
- Wywołanie wysyłki w `payments.ts` (markPaid) i w `checkout.ts` (gałąź bez Stripe).

## Instalacja (dla 2 osób)
1. Otwórz link panelu w **Safari**.
2. Udostępnij → **Do ekranu głównego**.
3. Otwórz z ikony, wpisz raz **adres API + ADMIN_API_KEY**.
4. Zezwól na **powiadomienia** (jednorazowo).

## Poza zakresem (YAGNI)
- Android, App Store, TestFlight.
- Logowanie/konta — zostaje wspólny klucz admina.
- E-mail jako backup powiadomień (możliwe później jako 100% pewny kanał).
