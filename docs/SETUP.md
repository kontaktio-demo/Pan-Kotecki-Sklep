# Pan Kotecki - runbook (co kliknąć i gdzie wkleić)

Idziemy etapami. Ten plik rośnie wraz z projektem. Jak skończysz etap - daj znać,
przejdziemy dalej.

---

## Etap 0 - Załóż konta (darmowe)

1. **Supabase** - https://supabase.com → „Start your project" (login GitHub).
2. **Render** - https://render.com → załóż konto (login GitHub).
3. *(Później)* **Stripe** - https://stripe.com (płatności).
4. *(Później)* **InPost ShipX** - https://manager.paczkomaty.pl (dostawa).

GitHub i repo już mamy: `kontaktio-demo/Pan-Kotecki-Sklep`.

---

## Etap 1 - Baza danych (Supabase) + API (Render)

### 1A. Utwórz projekt Supabase
- New project → nazwa „pan-kotecki", **Region: Frankfurt (EU)**, ustaw hasło do bazy.
- Po utworzeniu wejdź w **Project Settings → API** i zapisz:
  - **Project URL** (np. `https://abcd.supabase.co`) → to `SUPABASE_URL`
  - **service_role** key (sekret!) → to `SUPABASE_SERVICE_ROLE_KEY`
  - **anon public** key (przyda się później dla sklepu)

### 1B. Załóż tabele (jedna komenda)
- W Supabase: **SQL Editor → New query**.
- Wklej **całą** zawartość pliku `supabase/setup_all.sql` → **Run**.
  (To jeden plik: tabele + RLS + 4 kategorie + 20 produktów. Bezpieczny do
  ponownego uruchomienia.)
- Sprawdź: **Table Editor** → tabele (products, orders itd.), 4 kategorie i 20 produktów.

### 1C. Bucket na zdjęcia produktów
- **Storage → New bucket** → nazwa `product-images` → zaznacz **Public bucket** → Create.

### 1D. Postaw backend na Render
- Render → **New → Web Service** → Connect repo `Pan-Kotecki-Sklep`.
- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Environment** → dodaj zmienne (Add Environment Variable):
  - `SUPABASE_URL` = (Project URL z 1A)
  - `SUPABASE_SERVICE_ROLE_KEY` = (service_role z 1A)
  - `ADMIN_API_KEY` = długi losowy ciąg (`openssl rand -hex 32`) - **klucz panelu**; ten sam wpiszesz w aplikacji desktopowej
  - `CLIENT_ORIGIN` = `https://pankotecki.pl,http://localhost:3000` (na razie może być samo `*`)
  - **NIE** dodawaj `PORT` - Render ustawia sam.
- Create Web Service. Po zbudowaniu dostaniesz adres typu `https://pan-kotecki-backend.onrender.com`.

### 1E. Sprawdź, że działa
- Otwórz w przeglądarce:
  - `https://...onrender.com/health` → `{"ok":true,...}`
  - `https://...onrender.com/api/categories` → lista 4 kategorii
- **Podeślij mi ten adres `...onrender.com`** - podepnę pod niego sklep i przetestuję `/api/products`.

> Uwaga: darmowy Render usypia usługę po ~15 min bezczynności (pierwsze wejście
> po przerwie ~30 s). Na produkcję włączymy płatny plan albo „keep-alive".

---

---

## Etap 2 - Podłącz sklep do bazy (Vercel)

Sklep (Next.js) domyślnie używa danych lokalnych. Żeby czytał z bazy przez API:
- W projekcie sklepu na **Vercel → Settings → Environment Variables** dodaj:
  - `NEXT_PUBLIC_API_URL` = adres backendu z Render, np. `https://pan-kotecki-backend.onrender.com`
- Redeploy. Od teraz produkty/kategorie na stronie pochodzą z bazy (panelu).
- Lokalnie: w pliku `.env.local` w głównym folderze wpisz `NEXT_PUBLIC_API_URL=https://...onrender.com`.

> Gdy `NEXT_PUBLIC_API_URL` nie jest ustawione albo API nie odpowiada - sklep
> automatycznie pokazuje dane lokalne (nigdy nie jest pusty).

## Etap 3 - Panel (aplikacja desktopowa, .exe)

Panel to **osobna aplikacja na pulpicie** (zwykły `.exe` z ikoną) - nie ma jej
w repozytorium. Bez logowania: przy pierwszym uruchomieniu wpisujesz raz:
- **Adres API** = `https://...onrender.com`
- **Klucz panelu** = ten sam `ADMIN_API_KEY`, który ustawiłeś w Render

Potem aplikacja otwiera się prosto do pulpitu sprzedaży. Plik `.exe` możesz
przekazać znajomemu - on u siebie wpisze ten sam adres i klucz.

## Etap 4 - Składanie zamówień + dostawa (już w setup_all)

Bezpieczne, atomowe składanie zamówień (bez „oversprzedaży"), kolumna na przesyłki
InPost (`shipping_ref`) oraz tabela `push_subscriptions` są już zawarte w
`supabase/setup_all.sql` z Etapu 1.

- Jeśli baza powstała wcześniej (przed tymi funkcjami), po prostu uruchom ponownie
  całą zawartość `supabase/setup_all.sql` → **Run**. Jest bezpieczny do powtórzenia.

---

## Etap 5 - Płatności: Stripe (karta / BLIK / Przelewy24)

### 5A. Konto i klucz
1. Załóż konto na https://stripe.com (możesz zacząć w trybie **Test**).
2. **Developers → API keys** → skopiuj **Secret key** (`sk_test_...` lub `sk_live_...`).
3. **Settings → Payment methods** → włącz **Karta**, **BLIK**, **Przelewy24** (PLN).

### 5B. Zmienne na Render (backend)
Dodaj w usłudze backendu (Environment):
- `STRIPE_SECRET_KEY` = `sk_...`
- `SITE_URL` = adres sklepu z Vercela, np. `https://kotecki.pl` (powrót po płatności)
- `NODE_ENV` = `production`
- upewnij się, że `CLIENT_ORIGIN` zawiera adres sklepu (np. `https://kotecki.pl`)

### 5C. Webhook (potwierdzenie płatności)
1. Stripe → **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL:** `https://TWOJ-BACKEND.onrender.com/api/payments/webhook`
3. **Events to send** - zaznacz:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
4. Po utworzeniu → **Signing secret** (`whsec_...`) → dodaj na Render jako `STRIPE_WEBHOOK_SECRET`.
5. **Zapisz / redeploy** backend.

### 5D. Test
- Wejdź na sklep → dodaj produkt → **Kasa → Zamawiam i płacę** → przekieruje na Stripe.
- Karta testowa: `4242 4242 4242 4242`, dowolna data w przyszłości, dowolny CVC.
- Po opłaceniu wrócisz na „Dziękujemy", a w panelu zamówienie ma **Płatność: opłacone**.

> Gdy `STRIPE_SECRET_KEY` nie jest ustawiony, sklep nadal przyjmuje zamówienia
> (np. odbiór osobisty), tylko bez online-płatności. Nic się nie psuje.

---

## Etap 6 - Dostawa: InPost (paczkomaty + kurier)

### 6A. Konto ShipX
1. https://manager.paczkomaty.pl → konto firmowe → sekcja **API (ShipX)**.
2. Wygeneruj **token API** oraz odczytaj **ID organizacji** (Organization ID).

### 6B. Zmienne na Render (backend)
- `INPOST_TOKEN` = token z ShipX
- `INPOST_ORG_ID` = ID organizacji
- *(opcjonalnie)* `INPOST_PARCEL_TEMPLATE` = `small` / `medium` / `large`
- *(sandbox)* `INPOST_BASE_URL` = adres sandboxa ShipX, jeśli testujesz

Redeploy backend.

### 6C. Mapa paczkomatów na sklepie (opcjonalnie, ładniejszy wybór)
- Vercel → Environment Variables → `NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN` = token Geowidgetu InPost → redeploy.
- Bez tego klient po prostu wpisuje **kod paczkomatu** (np. `LOD01M`) - też działa.

### 6D. Jak nadać paczkę (panel)
- Panel → **Zamówienia** → otwórz zamówienie → **Generuj etykietę InPost**.
- Zapisze się numer śledzenia, status zmieni się na „Spakowane".
- **Pobierz etykietę (PDF)** → otwiera etykietę do druku.

> Gdy `INPOST_TOKEN`/`INPOST_ORG_ID` nie są ustawione, panel pokaże komunikat
> „InPost nie skonfigurowany" - reszta działa normalnie.

---

## Etap 7 - Panel na telefon (iOS, PWA) + powiadomienia o zakupach

Mobilny panel to osobna apka webowa (folder `panel-mobile/`) - wygląda i działa
jak natywna appka (własna ikona, pełny ekran), a przy **każdym opłaconym
zamówieniu** dzwoni powiadomienie na telefon.

### 7A. Klucze powiadomień (VAPID) na Render
Wygeneruj parę kluczy (raz):
```
cd backend && npx web-push generate-vapid-keys
```
Dodaj na **Render → backend → Environment**:
- `VAPID_PUBLIC_KEY` = (publiczny)
- `VAPID_PRIVATE_KEY` = (prywatny)
- `VAPID_SUBJECT` = `mailto:twoj@email.pl`

Upewnij się, że uruchomiłeś `supabase/setup_all.sql` (zawiera tabelę
`push_subscriptions`). Render się przeładuje.

### 7B. Postaw mobilny panel na Vercel (za darmo)
- Vercel → **Add New → Project** → ten sam repo `Pan-Kotecki-Sklep`.
- **Root Directory:** `panel-mobile`  - **Framework:** Vite (wykryje sam).
- Deploy. Dostaniesz adres, np. `https://panel-pan-kotecki.vercel.app`.

### 7C. Zainstaluj na iPhone (obie osoby)
1. Otwórz adres panelu w **Safari**.
2. **Udostępnij** (kwadrat ze strzałką) → **Do ekranu głównego** → Dodaj.
3. Otwórz apkę **z ikony na ekranie** (ważne - nie z Safari).
4. Wpisz raz **adres API** (Render) + **ADMIN_API_KEY** → Połącz.
5. Zakładka **Powiadomienia** (dzwonek u góry) → **Włącz powiadomienia** → zezwól.
6. Sprawdź: **Wyślij testowe 🔔** - powinno przyjść powiadomienie.

Od teraz każde opłacone zamówienie = dzwonek na obu telefonach.

---

## Skrót: wszystkie zmienne środowiskowe

**Render (backend):** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_API_KEY`,
`CLIENT_ORIGIN`, `SITE_URL`, `NODE_ENV=production`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `INPOST_TOKEN`, `INPOST_ORG_ID`, `VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

**Vercel (sklep):** `NEXT_PUBLIC_API_URL` (wymagane), `NEXT_PUBLIC_SUPABASE_URL`
(zalecane - zawęża hosty zdjęć), `NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN` (opcjonalne).

**Vercel (panel mobilny):** osobny projekt, Root Directory = `panel-mobile`. Bez zmiennych.

**Panel (.exe / mobilny):** adres API + `ADMIN_API_KEY` (wpisujesz raz w aplikacji).
