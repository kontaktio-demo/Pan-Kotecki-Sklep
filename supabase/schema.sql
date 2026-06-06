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
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
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
