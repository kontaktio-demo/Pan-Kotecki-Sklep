# Pan Kotecki — runbook (co kliknąć i gdzie wkleić)

Idziemy etapami. Ten plik rośnie wraz z projektem. Jak skończysz etap — daj znać,
przejdziemy dalej.

---

## Etap 0 — Załóż konta (darmowe)

1. **Supabase** — https://supabase.com → „Start your project" (login GitHub).
2. **Render** — https://render.com → załóż konto (login GitHub).
3. *(Później)* **Stripe** — https://stripe.com (płatności).
4. *(Później)* **InPost ShipX** — https://manager.paczkomaty.pl (dostawa).

GitHub i repo już mamy: `kontaktio-demo/Pan-Kotecki-Sklep`.

---

## Etap 1 — Baza danych (Supabase) + API (Render)

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
  - `ADMIN_API_KEY` = długi losowy ciąg (`openssl rand -hex 32`) — **klucz panelu**; ten sam wpiszesz w aplikacji desktopowej
  - `CLIENT_ORIGIN` = `https://pankotecki.pl,http://localhost:3000` (na razie może być samo `*`)
  - **NIE** dodawaj `PORT` — Render ustawia sam.
- Create Web Service. Po zbudowaniu dostaniesz adres typu `https://pan-kotecki-backend.onrender.com`.

### 1E. Sprawdź, że działa
- Otwórz w przeglądarce:
  - `https://…onrender.com/health` → `{"ok":true,...}`
  - `https://…onrender.com/api/categories` → lista 4 kategorii
- **Podeślij mi ten adres `…onrender.com`** — podepnę pod niego sklep i przetestuję `/api/products`.

> Uwaga: darmowy Render usypia usługę po ~15 min bezczynności (pierwsze wejście
> po przerwie ~30 s). Na produkcję włączymy płatny plan albo „keep-alive".

---

---

## Etap 2 — Podłącz sklep do bazy (Vercel)

Sklep (Next.js) domyślnie używa danych lokalnych. Żeby czytał z bazy przez API:
- W projekcie sklepu na **Vercel → Settings → Environment Variables** dodaj:
  - `NEXT_PUBLIC_API_URL` = adres backendu z Render, np. `https://pan-kotecki-backend.onrender.com`
- Redeploy. Od teraz produkty/kategorie na stronie pochodzą z bazy (panelu).
- Lokalnie: w pliku `.env.local` w głównym folderze wpisz `NEXT_PUBLIC_API_URL=https://…onrender.com`.

> Gdy `NEXT_PUBLIC_API_URL` nie jest ustawione albo API nie odpowiada — sklep
> automatycznie pokazuje dane lokalne (nigdy nie jest pusty).

## Etap 3 — Panel (aplikacja desktopowa, .exe)

Panel to **osobna aplikacja na pulpicie** (zwykły `.exe` z ikoną) — nie ma jej
w repozytorium. Bez logowania: przy pierwszym uruchomieniu wpisujesz raz:
- **Adres API** = `https://…onrender.com`
- **Klucz panelu** = ten sam `ADMIN_API_KEY`, który ustawiłeś w Render

Potem aplikacja otwiera się prosto do pulpitu sprzedaży. Plik `.exe` możesz
przekazać znajomemu — on u siebie wpisze ten sam adres i klucz.

## Następne etapy (buduję)
5. Płatności (Stripe: BLIK/Przelewy24/karta) + webhook + statusy zamówień.
6. Dostawa (InPost: paczkomaty + kurier, etykiety).
