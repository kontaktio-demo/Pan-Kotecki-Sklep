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

### 1B. Załóż tabele
- W Supabase: **SQL Editor → New query**.
- Wklej całą zawartość pliku `supabase/schema.sql` → **Run**.
- Potem to samo z `supabase/policies.sql` → **Run**.
- Potem `supabase/seed.sql` → **Run** (doda 4 kategorie).
- Potem `supabase/seed_products.sql` → **Run** (doda 20 produktów startowych).
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
  - `JWT_SECRET` = dowolny długi losowy ciąg (np. z https://www.uuidgenerator.net/ kilka sklejonych, albo `openssl rand -hex 32`)
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

## Następne etapy (buduję równolegle)
2. Migracja 20 produktów do bazy + podpięcie sklepu pod API.
3. Logowanie admina + pełny panel (Electron): produkty/zdjęcia/kategorie/promocje/zamówienia/klienci/sprzedaż.
4. Płatności (Stripe: BLIK/Przelewy24/karta).
5. Dostawa (InPost: paczkomaty + kurier, etykiety).
