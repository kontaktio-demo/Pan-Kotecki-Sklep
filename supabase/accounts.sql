-- =============================================================
-- Pan Kotecki - KONTA KLIENTÓW (passwordless, Supabase Auth).
-- Wklej całość do Supabase SQL Editor i kliknij RUN.
-- Można uruchomić ponownie (idempotentne: if not exists / create or replace).
--
-- Model: gość jest domyślny. Konto to DODATEK - logowanie bez hasła
-- (magic link / kod e-mail) przez wbudowane Supabase Auth (tabela auth.users).
-- Backend (service_role) czyta/zapisuje dane konta po weryfikacji tokenu.
-- =============================================================

create extension if not exists "pgcrypto";

-- ── orders: powiązanie z kontem (opcjonalne) ─────────────────
-- Zamówienia gościa mają user_id = NULL. Po zalogowaniu wiążemy je po e-mailu.
alter table orders add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists orders_user_idx on orders (user_id);
create index if not exists orders_email_lower_idx on orders (lower(email));

-- ── Profil konta (1:1 z auth.users) ──────────────────────────
create table if not exists account_profiles (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  full_name         text,
  phone             text,
  marketing_consent boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
drop trigger if exists account_profiles_set_updated on account_profiles;
create trigger account_profiles_set_updated before update on account_profiles
  for each row execute function set_updated_at();

-- ── Książka adresowa (1:N) ───────────────────────────────────
create table if not exists account_addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text,                       -- np. „Dom", „Praca"
  first_name  text,
  last_name   text,
  street      text,
  building    text,
  apartment   text,
  postal_code text,
  city        text,
  phone       text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists account_addresses_user_idx on account_addresses (user_id);
drop trigger if exists account_addresses_set_updated on account_addresses;
create trigger account_addresses_set_updated before update on account_addresses
  for each row execute function set_updated_at();

-- ===== RLS - klient widzi i zmienia TYLKO swoje dane =====
-- Backend działa na service_role (omija RLS). Polityki to obrona w głąb
-- (oraz umożliwiają ewentualny bezpośredni dostęp z klienta przez anon-key).
alter table account_profiles  enable row level security;
alter table account_addresses enable row level security;

drop policy if exists "own profile select" on account_profiles;
create policy "own profile select" on account_profiles for select using (auth.uid() = user_id);
drop policy if exists "own profile insert" on account_profiles;
create policy "own profile insert" on account_profiles for insert with check (auth.uid() = user_id);
drop policy if exists "own profile update" on account_profiles;
create policy "own profile update" on account_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own profile delete" on account_profiles;
create policy "own profile delete" on account_profiles for delete using (auth.uid() = user_id);

drop policy if exists "own address select" on account_addresses;
create policy "own address select" on account_addresses for select using (auth.uid() = user_id);
drop policy if exists "own address insert" on account_addresses;
create policy "own address insert" on account_addresses for insert with check (auth.uid() = user_id);
drop policy if exists "own address update" on account_addresses;
create policy "own address update" on account_addresses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own address delete" on account_addresses;
create policy "own address delete" on account_addresses for delete using (auth.uid() = user_id);

grant select, insert, update, delete on account_profiles  to authenticated;
grant select, insert, update, delete on account_addresses to authenticated;

-- ===== create_order: dołożenie user_id (atomowo, jak dotąd) =====
-- Pełna podmiana funkcji - identyczna logika + zapis user_id (gość = NULL).
create or replace function create_order(p jsonb)
returns jsonb
language plpgsql
set search_path = public, pg_temp
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
    number, customer_id, user_id, email, phone, status, payment_status,
    subtotal_grosze, discount_grosze, shipping_grosze, total_grosze, currency,
    promo_code, shipping_method, shipping_address, parcel_locker
  ) values (
    v_number,
    nullif(p->>'customer_id', '')::uuid,
    nullif(p->>'user_id', '')::uuid,
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
