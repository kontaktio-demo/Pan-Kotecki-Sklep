-- =============================================================
-- Pan Kotecki — JEDEN plik do Supabase SQL Editor.
-- Wklej całość i kliknij RUN. Tworzy tabele + RLS + kategorie + produkty.
-- Można uruchomić ponownie (bezpieczne: if not exists / on conflict).
-- =============================================================

-- ===== 1. TABELE =====
-- Pan Kotecki — schemat bazy (Supabase / Postgres)
-- Uruchom w Supabase: SQL Editor → wklej → Run.

create extension if not exists "pgcrypto";

-- helper: automatyczny updated_at
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── Kategorie ────────────────────────────────────────────────
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  tagline     text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ── Produkty ─────────────────────────────────────────────────
create table if not exists products (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name              text not null,
  category_id       uuid references categories(id) on delete set null,
  price_grosze      int not null default 0,
  sale_price_grosze int,
  currency          text not null default 'PLN',
  short_description text,
  description       text,
  details           text[] not null default '{}',
  badges            text[] not null default '{}',
  bestseller        boolean not null default false,
  in_stock          boolean not null default true,
  stock_qty         int,
  active            boolean not null default true,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists products_category_idx on products (category_id);
create index if not exists products_active_idx on products (active);
drop trigger if exists products_set_updated on products;
create trigger products_set_updated before update on products
  for each row execute function set_updated_at();

-- ── Zdjęcia produktów (pliki w Supabase Storage) ─────────────
create table if not exists product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  url          text not null,
  storage_path text,
  alt          text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists product_images_product_idx on product_images (product_id);

-- ── Promocje (kody rabatowe) ─────────────────────────────────
create table if not exists promotions (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null,
  name             text,
  kind             text not null default 'percent',   -- 'percent' | 'fixed'
  value            int not null default 0,             -- procent (0-100) lub grosze
  min_order_grosze int not null default 0,
  active           boolean not null default true,
  starts_at        timestamptz,
  ends_at          timestamptz,
  usage_limit      int,
  used_count       int not null default 0,
  created_at       timestamptz not null default now()
);

-- ── Klienci ──────────────────────────────────────────────────
create table if not exists customers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  name       text,
  phone      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists customers_email_idx on customers (lower(email));
drop trigger if exists customers_set_updated on customers;
create trigger customers_set_updated before update on customers
  for each row execute function set_updated_at();

-- ── Zamówienia ───────────────────────────────────────────────
create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  number           text unique not null,
  customer_id      uuid references customers(id) on delete set null,
  email            text not null,
  phone            text,
  status           text not null default 'pending',  -- pending|paid|packed|shipped|delivered|cancelled|refunded
  payment_status   text not null default 'unpaid',   -- unpaid|paid|failed|refunded
  payment_provider text,
  payment_ref      text,
  subtotal_grosze  int not null default 0,
  discount_grosze  int not null default 0,
  shipping_grosze  int not null default 0,
  total_grosze     int not null default 0,
  currency         text not null default 'PLN',
  promo_code       text,
  shipping_method  text,                              -- inpost_locker|inpost_courier|pickup
  shipping_address jsonb,
  parcel_locker    text,
  tracking_number  text,
  label_url        text,
  shipping_ref     text,                              -- id przesyłki w InPost ShipX
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
-- dla istniejących baz (gdy tabela już była utworzona wcześniej):
alter table orders add column if not exists shipping_ref text;
create index if not exists orders_status_idx on orders (status);
create index if not exists orders_created_idx on orders (created_at);
drop trigger if exists orders_set_updated on orders;
create trigger orders_set_updated before update on orders
  for each row execute function set_updated_at();

-- ── Pozycje zamówienia ───────────────────────────────────────
create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  slug         text,
  name         text not null,
  price_grosze int not null,
  qty          int not null default 1,
  image_url    text
);
create index if not exists order_items_order_idx on order_items (order_id);

-- ── Administratorzy (logowanie do panelu) ────────────────────
create table if not exists admins (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  name          text,
  created_at    timestamptz not null default now()
);

-- ── Ustawienia (klucz → wartość JSON) ────────────────────────
create table if not exists settings (
  key        text primary key,
  value      jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

insert into settings (key, value) values
  ('store', '{"free_shipping_grosze": 14900, "currency": "PLN"}')
  on conflict (key) do nothing;

-- ===== 2. RLS / POLITYKI =====
-- Pan Kotecki — RLS (Row Level Security)
-- Backend używa SERVICE_ROLE_KEY (omija RLS) — to on robi zapisy.
-- Publicznie (anon) dostępny jest tylko ODCZYT katalogu, gdyby sklep czytał
-- z Supabase bezpośrednio. Reszta zamknięta.

alter table categories     enable row level security;
alter table products       enable row level security;
alter table product_images enable row level security;
alter table promotions     enable row level security;
alter table customers      enable row level security;
alter table orders         enable row level security;
alter table order_items    enable row level security;
alter table admins         enable row level security;
alter table settings       enable row level security;

drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories
  for select using (true);

drop policy if exists "public read active products" on products;
create policy "public read active products" on products
  for select using (active = true);

drop policy if exists "public read product images" on product_images;
create policy "public read product images" on product_images
  for select using (true);

-- promotions/customers/orders/order_items/admins/settings:
-- brak polityk publicznych → dostęp tylko przez backend (service role).

-- ===== 3. KATEGORIE =====
-- Pan Kotecki — dane startowe (kategorie). Produkty migrujemy skryptem.

insert into categories (slug, name, tagline, sort_order) values
  ('zabawki',         'Zabawki',         'Polowanie, skok, mruczenie — dla kociej energii.', 1),
  ('akcesoria',       'Akcesoria',       'Codzienność kota dopracowana w każdym detalu.',    2),
  ('kubki',           'Kubki',           'Poranna kawa lepiej smakuje z kotem na boku.',     3),
  ('dla-wlasciciela', 'Dla właściciela', 'Noś swoją miłość do kotów — dosłownie.',           4)
on conflict (slug) do nothing;

-- ===== 4. PRODUKTY =====
-- Pan Kotecki — produkty startowe (wygenerowane z lib/products.ts).
-- Wklej w Supabase SQL Editor i uruchom (wymaga wcześniej seed.sql z kategoriami).

insert into products
  (slug, name, category_id, price_grosze, short_description, description, details, badges, bestseller, in_stock, sort_order)
values
('mysz-fela', 'Mysz na sznurku „Fela”', (select id from categories where slug = 'zabawki'), 2400, 'Klasyk, którego żaden kot nie ignoruje.', 'Miękka mysz z naturalnym sznurkiem i szczyptą kocimiętki w środku. Lekka, idealnie wyważona do podrzucania i łapania. Sprawdza się w samotnej zabawie i w pojedynku z wędką.', ARRAY['Wymiary: 7 cm + 20 cm sznurek', 'Wypełnienie z kocimiętką', 'Materiał: filc i bawełna']::text[], ARRAY['Bestseller']::text[], true, true, 1),
('wedka-lowca', 'Wędka z piórkiem „Łowca”', (select id from categories where slug = 'zabawki'), 3900, 'Wyzwala instynkt łowcy w trzy sekundy.', 'Elastyczny pręt, długa linka i piórka, które tańczą przy najmniejszym ruchu. Stworzona do wspólnej zabawy, która rozrusza nawet leniwego kanapowca.', ARRAY['Długość pręta: 45 cm', 'Wymienne piórka', 'Antypoślizgowy uchwyt']::text[], '{}'::text[], true, true, 2),
('pilki-dzwoneczek', 'Piłki z dzwoneczkiem (3-pak)', (select id from categories where slug = 'zabawki'), 1900, 'Trzy kolory, jeden cel — gonić.', 'Lekkie, ażurowe piłki z dzwoneczkiem w środku. Toczą się nieprzewidywalnie po podłodze i potrafią zająć kota na długie minuty.', ARRAY['3 sztuki', 'Średnica: 4 cm', 'Cichy dzwoneczek']::text[], '{}'::text[], false, true, 3),
('tunel-jaskinia', 'Tunel składany „Jaskinia”', (select id from categories where slug = 'zabawki'), 8900, 'Kryjówka, zasadzka i tor wyścigowy w jednym.', 'Składany tunel z szeleszczącą warstwą i okienkiem do zaczepek. Rozkłada się w sekundę, a po zabawie chowa na płasko. Łączy się z innymi tunelami w cały labirynt.', ARRAY['Długość: 90 cm', 'Składany, na płasko', 'Szeleszcząca wyściółka']::text[], '{}'::text[], true, true, 4),
('kopak-kocimietka', 'Kopak z kocimiętką „Banan”', (select id from categories where slug = 'zabawki'), 2900, 'Do przytulania, kopania i obejmowania łapami.', 'Wydłużony kopak wypełniony kocimiętką, w sam raz do chwytania przednimi łapami i młócenia tylnymi. Klasyczna forma zabawy, która rozładowuje kocią energię.', ARRAY['Długość: 23 cm', 'Naturalna kocimiętka', 'Wytrzymały szew']::text[], '{}'::text[], false, true, 5),
('legowisko-chmurka', 'Legowisko „Chmurka”', (select id from categories where slug = 'akcesoria'), 15900, 'Miękkie gniazdo, z którego nie chce się wychodzić.', 'Okrągłe legowisko z wysokim, miękkim rantem dającym poczucie bezpieczeństwa. Wyjmowana poduszka, przyjemny w dotyku materiał i dno antypoślizgowe.', ARRAY['Średnica: 50 cm', 'Zdejmowana poszewka', 'Pranie w 30°C']::text[], ARRAY['Bestseller']::text[], true, true, 6),
('miska-lapka', 'Miska ceramiczna „Łapka”', (select id from categories where slug = 'akcesoria'), 4900, 'Płytka miska, która szanuje kocie wąsy.', 'Szeroka, niska miska z wypalanej ceramiki — bez podrażniania wąsów. Stabilna podstawa i powierzchnia łatwa do utrzymania w czystości.', ARRAY['Pojemność: 250 ml', 'Ceramika szkliwiona', 'Można myć w zmywarce']::text[], '{}'::text[], false, true, 7),
('fontanna-zrodlo', 'Fontanna do picia „Źródło”', (select id from categories where slug = 'akcesoria'), 19900, 'Świeża, krążąca woda zachęca do picia.', 'Cicha fontanna z filtrem, która utrzymuje wodę w ruchu i świeżości. Delikatny szum zachęca kota do częstszego picia — wsparcie dla nerek i nawodnienia.', ARRAY['Pojemność: 2 l', 'Cichy silnik', 'Filtr węglowy w zestawie']::text[], '{}'::text[], true, true, 8),
('drapak-wieza', 'Drapak słupek „Wieża”', (select id from categories where slug = 'akcesoria'), 21900, 'Punkt widokowy i drapak w jednym.', 'Stabilny słupek owinięty sizalem, zwieńczony platformą do obserwacji świata. Ratuje kanapę i daje kotu jego własne, wysokie miejsce.', ARRAY['Wysokość: 80 cm', 'Naturalny sizal', 'Stabilna podstawa']::text[], '{}'::text[], false, true, 9),
('obroza-dzwonek', 'Obroża z zawieszką „Dzwonek”', (select id from categories where slug = 'akcesoria'), 3500, 'Bezpieczne zapięcie, miejsce na adresówkę.', 'Miękka obroża z zapięciem bezpieczeństwa, które puszcza pod naciskiem. Regulowana, z zawieszką na adres i dyskretnym dzwoneczkiem.', ARRAY['Regulacja: 20–30 cm', 'Zapięcie bezpieczeństwa', 'Miejsce na adresówkę']::text[], '{}'::text[], false, true, 10),
('transporter-wyprawa', 'Transporter „Wyprawa”', (select id from categories where slug = 'akcesoria'), 14900, 'Spokojna podróż do weterynarza i dalej.', 'Lekki, dobrze wentylowany transporter z miękkim wnętrzem i pewnym zapięciem. Górne otwarcie ułatwia wkładanie nieprzekonanego pasażera.', ARRAY['Do 7 kg', 'Wentylacja z trzech stron', 'Składany']::text[], '{}'::text[], false, true, 11),
('szczotka-wyczesujaca', 'Szczotka wyczesująca „Gładko”', (select id from categories where slug = 'akcesoria'), 3900, 'Mniej sierści na kanapie, więcej na szczotce.', 'Szczotka z chowanymi zębami — jednym kliknięciem usuwasz zebraną sierść. Delikatna dla skóry, skuteczna w usuwaniu martwego podszerstka.', ARRAY['Chowane zęby', 'Ergonomiczny uchwyt', 'Do każdej długości włosa']::text[], '{}'::text[], false, true, 12),
('kubek-poranny-mruczek', 'Kubek „Poranny Mruczek”', (select id from categories where slug = 'kubki'), 5900, 'Pierwsza kawa i kot na parapecie.', 'Pojemny kubek z grubej ceramiki z minimalistycznym kocim motywem. Przyjemny w dłoni, długo trzyma ciepło. Do kawy, herbaty i porannego wpatrywania się w okno.', ARRAY['Pojemność: 350 ml', 'Ceramika', 'Można myć w zmywarce']::text[], ARRAY['Bestseller']::text[], true, true, 13),
('kubek-termiczny-w-drodze', 'Kubek termiczny „W drodze”', (select id from categories where slug = 'kubki'), 8900, 'Ciepła kawa przez całą poranną trasę.', 'Stalowy kubek termiczny z izolacją próżniową i szczelnym wieczkiem. Utrzymuje temperaturę godzinami i mieści się w uchwycie samochodowym.', ARRAY['Pojemność: 450 ml', 'Stal nierdzewna', 'Szczelne wieczko']::text[], '{}'::text[], false, true, 14),
('kubki-on-i-kot', 'Zestaw 2 kubki „On i Kot”', (select id from categories where slug = 'kubki'), 9900, 'Dwa kubki, jedna wspólna poranna rutyna.', 'Para kubków w spójnym, minimalnym stylu — jeden dla Ciebie, drugi dla wielbiciela kotów obok. Świetny pomysł na prezent.', ARRAY['2 sztuki po 300 ml', 'Ceramika', 'W pudełku prezentowym']::text[], '{}'::text[], false, true, 15),
('torba-crazy-cat', 'Torba płócienna „Crazy Cat”', (select id from categories where slug = 'dla-wlasciciela'), 4500, 'Zakupy, książki i koci manifest na ramieniu.', 'Mocna bawełniana torba z minimalnym nadrukiem. Długie ucha, pojemne wnętrze i charakter, który mówi wszystko bez słów.', ARRAY['Bawełna 280 g/m²', 'Wymiary: 38 × 42 cm', 'Długie ucha']::text[], '{}'::text[], true, true, 16),
('skarpetki-lapki', 'Skarpetki „Łapki” (2-pak)', (select id from categories where slug = 'dla-wlasciciela'), 2900, 'Kocie łapki na Twoich stopach.', 'Miękkie, oddychające skarpetki z dyskretnym motywem łapek. Dwie pary w pudełku — dla siebie albo na prezent.', ARRAY['2 pary', 'Bawełna z domieszką elastanu', 'Rozmiar uniwersalny 38–43']::text[], '{}'::text[], false, true, 17),
('przypinka-kot', 'Przypinka emaliowana „Kot”', (select id from categories where slug = 'dla-wlasciciela'), 1900, 'Mały detal, wielka deklaracja.', 'Emaliowana przypinka z sylwetką kota i mocnym zapięciem motylkowym. Idealna na kurtkę, plecak albo płócienną torbę.', ARRAY['Wymiary: 2,5 cm', 'Twarda emalia', 'Zapięcie motylkowe']::text[], '{}'::text[], false, true, 18),
('notes-dziennik-kota', 'Notes „Dziennik Kota”', (select id from categories where slug = 'dla-wlasciciela'), 3500, 'Na notatki, plany i kocie obserwacje.', 'Notes w twardej oprawie z gładkim papierem i wstążką-zakładką. Minimalna okładka z kocim akcentem. Leży płasko po otwarciu.', ARRAY['Format A5', '192 strony', 'Gumka i zakładka']::text[], '{}'::text[], false, true, 19),
('bluza-mow-do-kota', 'Bluza „Mów do kota”', (select id from categories where slug = 'dla-wlasciciela'), 15900, 'Miękka bluza dla zespołu „kot ważniejszy”.', 'Ciężka, miękka w środku bluza z kapturem i drobnym haftem. Krój oversize, materiał, z którego nie chce się wychodzić — zupełnie jak kot z legowiska.', ARRAY['Bawełna z pętelką 320 g/m²', 'Krój oversize', 'Rozmiary S–XXL']::text[], '{}'::text[], false, true, 20)
on conflict (slug) do nothing;

-- ===== 5. ATOMOWE SKŁADANIE ZAMÓWIENIA (RPC) =====
-- Jedna transakcja: dekrement stanu + licznik promocji + zamówienie + pozycje.
-- Chroni przed oversell i wyścigami (TOCTOU). Wywołuje tylko backend (service_role).

-- Idempotencja webhooków Stripe — każde zdarzenie przetwarzamy dokładnie raz.
create table if not exists stripe_events (
  id          text primary key,
  received_at timestamptz not null default now()
);
alter table stripe_events enable row level security;

-- Subskrypcje powiadomień push (telefony właścicieli — panel mobilny).
create table if not exists push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  endpoint     text unique not null,
  subscription jsonb not null,
  created_at   timestamptz not null default now()
);
alter table push_subscriptions enable row level security;

create or replace function create_order(p jsonb)
returns jsonb
language plpgsql
as $$
declare
  it        jsonb;
  v_qty     int;
  v_order   uuid;
  v_number  text := p->>'number';
  v_promo   uuid := nullif(p->>'promo_id', '')::uuid;
  v_rows    int;
begin
  for it in select * from jsonb_array_elements(p->'items')
  loop
    v_qty := (it->>'qty')::int;
    update products
       set stock_qty = stock_qty - v_qty
     where id = (it->>'product_id')::uuid
       and (stock_qty is null or stock_qty >= v_qty);
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      raise exception 'OUT_OF_STOCK:%', (it->>'slug') using errcode = 'P0001';
    end if;
  end loop;

  if v_promo is not null then
    update promotions
       set used_count = used_count + 1
     where id = v_promo
       and active = true
       and (usage_limit is null or used_count < usage_limit);
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      raise exception 'PROMO_EXHAUSTED' using errcode = 'P0001';
    end if;
  end if;

  insert into orders (
    number, customer_id, email, phone, status, payment_status,
    subtotal_grosze, discount_grosze, shipping_grosze, total_grosze, currency,
    promo_code, shipping_method, shipping_address, parcel_locker
  ) values (
    v_number,
    nullif(p->>'customer_id', '')::uuid,
    p->>'email',
    nullif(p->>'phone', ''),
    'pending', 'unpaid',
    (p->>'subtotal_grosze')::int,
    (p->>'discount_grosze')::int,
    (p->>'shipping_grosze')::int,
    (p->>'total_grosze')::int,
    coalesce(nullif(p->>'currency', ''), 'PLN'),
    nullif(p->>'promo_code', ''),
    p->>'shipping_method',
    case when jsonb_typeof(p->'shipping_address') = 'object' then p->'shipping_address' else null end,
    nullif(p->>'parcel_locker', '')
  )
  returning id into v_order;

  insert into order_items (order_id, product_id, slug, name, price_grosze, qty, image_url)
  select
    v_order,
    (elem->>'product_id')::uuid,
    elem->>'slug',
    elem->>'name',
    (elem->>'price_grosze')::int,
    (elem->>'qty')::int,
    nullif(elem->>'image_url', '')
  from jsonb_array_elements(p->'items') as elem;

  return jsonb_build_object('order_id', v_order, 'number', v_number);
end;
$$;

revoke all on function create_order(jsonb) from public, anon, authenticated;
grant execute on function create_order(jsonb) to service_role;

-- Zwolnienie zamówienia (porzucona/odrzucona płatność): zwrot stanu i promocji.
create or replace function release_order(p_order uuid)
returns void
language plpgsql
as $$
declare
  v_status  text;
  v_payment text;
  v_promo   text;
  it        record;
begin
  select status, payment_status, promo_code into v_status, v_payment, v_promo
    from orders where id = p_order for update;
  if not found then return; end if;
  if v_payment = 'paid' or v_status in ('cancelled', 'refunded') then return; end if;

  for it in select product_id, qty from order_items where order_id = p_order loop
    update products set stock_qty = stock_qty + it.qty
      where id = it.product_id and stock_qty is not null;
  end loop;

  if v_promo is not null then
    update promotions set used_count = greatest(used_count - 1, 0) where code = v_promo;
  end if;

  update orders set status = 'cancelled', payment_status = 'failed' where id = p_order;
end;
$$;

revoke all on function release_order(uuid) from public, anon, authenticated;
grant execute on function release_order(uuid) to service_role;
