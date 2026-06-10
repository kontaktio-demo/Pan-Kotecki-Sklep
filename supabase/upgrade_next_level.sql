-- =============================================================
-- Pan Kotecki - UPGRADE: opinie, ulubione, historia zamówień,
-- statystyki w SQL, retencja zdarzeń Stripe, nowe ustawienia.
-- Wklej całość do Supabase SQL Editor i RUN. Idempotentne -
-- bezpieczne do ponownego uruchomienia. Uruchom PO setup_all.sql,
-- accounts.sql i hardening.sql.
-- =============================================================

create extension if not exists "pgcrypto";

-- ===== 1. OPINIE O PRODUKTACH (tylko zweryfikowany zakup) =====
-- Jedna opinia na (zamówienie, produkt). Moderacja: pending → approved/rejected.
create table if not exists product_reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  order_id    uuid not null references orders(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  author_name text not null,
  rating      int  not null check (rating between 1 and 5),
  body        text not null,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  verified    boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (order_id, product_id)
);
create index if not exists product_reviews_product_idx on product_reviews (product_id, status);
create index if not exists product_reviews_status_idx  on product_reviews (status, created_at desc);
alter table product_reviews enable row level security; -- brak polityk → tylko backend (service_role)

-- Agregaty ocen trzymamy na produkcie (trigger), żeby katalog nie liczył
-- średniej przy każdym odczycie.
alter table products add column if not exists rating_avg   numeric(3,2);
alter table products add column if not exists rating_count int not null default 0;

create or replace function recalc_product_rating(p_product uuid)
returns void
language sql
set search_path = public, pg_temp
as $$
  update products p set
    rating_avg = (select round(avg(rating)::numeric, 2) from product_reviews r
                   where r.product_id = p_product and r.status = 'approved'),
    rating_count = (select count(*)::int from product_reviews r
                     where r.product_id = p_product and r.status = 'approved')
  where p.id = p_product;
$$;

create or replace function product_reviews_changed()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op in ('INSERT','UPDATE') then
    perform recalc_product_rating(new.product_id);
  end if;
  if tg_op in ('UPDATE','DELETE') and (tg_op = 'DELETE' or old.product_id <> new.product_id) then
    perform recalc_product_rating(old.product_id);
  end if;
  return null;
end;
$$;

drop trigger if exists product_reviews_recalc on product_reviews;
create trigger product_reviews_recalc
  after insert or update or delete on product_reviews
  for each row execute function product_reviews_changed();

-- ===== 2. ULUBIONE (konta klientów) =====
create table if not exists wishlists (
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create index if not exists wishlists_user_idx on wishlists (user_id);
alter table wishlists enable row level security; -- dostęp przez backend (/api/account/wishlist)

-- ===== 3. HISTORIA STATUSÓW ZAMÓWIENIA (timeline dla klienta) =====
-- Triggery na orders łapią KAŻDĄ zmianę statusu (checkout, webhook, panel)
-- bez zmian w kodzie aplikacji.
create table if not exists order_status_history (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  status     text not null,
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on order_status_history (order_id, created_at);
alter table order_status_history enable row level security; -- tylko backend

create or replace function log_order_status()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into order_status_history (order_id, status) values (new.id, new.status);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into order_status_history (order_id, status) values (new.id, new.status);
  end if;
  return null;
end;
$$;

drop trigger if exists orders_log_status_insert on orders;
create trigger orders_log_status_insert
  after insert on orders
  for each row execute function log_order_status();

drop trigger if exists orders_log_status_update on orders;
create trigger orders_log_status_update
  after update on orders
  for each row execute function log_order_status();

-- Backfill: każde istniejące zamówienie dostaje przynajmniej wpis startowy
-- (z datą utworzenia zamówienia - przybliżenie).
insert into order_status_history (order_id, status, created_at)
select o.id, o.status, o.created_at
  from orders o
 where not exists (select 1 from order_status_history h where h.order_id = o.id);

-- ===== 4. STATYSTYKI SPRZEDAŻY W SQL (zamiast agregacji w JS) =====
create or replace function admin_sales_stats(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'revenue_grosze', coalesce((select sum(total_grosze) from orders
        where payment_status = 'paid' and created_at >= p_from and created_at < p_to), 0),
    'orders_total', (select count(*) from orders
        where created_at >= p_from and created_at < p_to),
    'orders_paid', (select count(*) from orders
        where payment_status = 'paid' and created_at >= p_from and created_at < p_to),
    'orders_pending', (select count(*) from orders
        where status = 'pending' and created_at >= p_from and created_at < p_to),
    'orders_shipped', (select count(*) from orders
        where status in ('shipped','delivered') and created_at >= p_from and created_at < p_to),
    'avg_order_grosze', coalesce((select round(avg(total_grosze))::bigint from orders
        where payment_status = 'paid' and created_at >= p_from and created_at < p_to), 0),
    'items_sold', coalesce((select sum(oi.qty)::int from order_items oi
        join orders o on o.id = oi.order_id
        where o.payment_status = 'paid' and o.created_at >= p_from and o.created_at < p_to), 0),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('d', d, 'revenue_grosze', rev, 'orders', cnt) order by d)
      from (
        select date_trunc('day', created_at)::date as d,
               sum(total_grosze) filter (where payment_status = 'paid') as rev,
               count(*) as cnt
          from orders
         where created_at >= p_from and created_at < p_to
         group by 1
      ) t), '[]'::jsonb),
    'top_products', coalesce((
      select jsonb_agg(jsonb_build_object('slug', slug, 'name', name, 'qty', qty, 'revenue_grosze', rev) order by qty desc)
      from (
        select oi.slug, oi.name, sum(oi.qty)::int as qty, sum(oi.qty * oi.price_grosze)::bigint as rev
          from order_items oi
          join orders o on o.id = oi.order_id
         where o.payment_status = 'paid' and o.created_at >= p_from and o.created_at < p_to
         group by oi.slug, oi.name
         order by qty desc
         limit 10
      ) t), '[]'::jsonb),
    'by_category', coalesce((
      select jsonb_agg(jsonb_build_object('slug', cslug, 'name', cname, 'qty', qty, 'revenue_grosze', rev) order by rev desc)
      from (
        select coalesce(c.slug, 'inne') as cslug,
               coalesce(c.name, 'Inne') as cname,
               sum(oi.qty)::int as qty,
               sum(oi.qty * oi.price_grosze)::bigint as rev
          from order_items oi
          join orders o on o.id = oi.order_id
          left join products p on p.id = oi.product_id
          left join categories c on c.id = p.category_id
         where o.payment_status = 'paid' and o.created_at >= p_from and o.created_at < p_to
         group by 1, 2
      ) t), '[]'::jsonb)
  );
$$;
revoke all on function admin_sales_stats(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function admin_sales_stats(timestamptz, timestamptz) to service_role;

-- Słupki miesięczne (dashboard "Podsumowanie").
create or replace function admin_revenue_by_month(p_months int default 6)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(jsonb_build_object('month', m, 'revenue_grosze', rev, 'orders', cnt) order by m), '[]'::jsonb)
  from (
    select to_char(date_trunc('month', created_at), 'YYYY-MM') as m,
           coalesce(sum(total_grosze) filter (where payment_status = 'paid'), 0)::bigint as rev,
           count(*) as cnt
      from orders
     where created_at >= date_trunc('month', now()) - make_interval(months => greatest(p_months, 1) - 1)
     group by 1
  ) t;
$$;
revoke all on function admin_revenue_by_month(int) from public, anon, authenticated;
grant execute on function admin_revenue_by_month(int) to service_role;

-- ===== 5. RETENCJA ZDARZEŃ STRIPE (idempotencja nie musi żyć wiecznie) =====
create or replace function cleanup_stripe_events(p_days int default 90)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_count int;
begin
  delete from stripe_events where received_at < now() - make_interval(days => greatest(p_days, 7));
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function cleanup_stripe_events(int) from public, anon, authenticated;
grant execute on function cleanup_stripe_events(int) to service_role;

-- ===== 6. NOWE USTAWIENIA SKLEPU (dopisz tylko brakujące klucze) =====
insert into settings (key, value) values ('store', '{"free_shipping_grosze": 14900, "currency": "PLN"}')
  on conflict (key) do nothing;
update settings set value = value || '{"shipping_locker_grosze": 1199}'::jsonb
  where key = 'store' and not (value ? 'shipping_locker_grosze');
update settings set value = value || '{"shipping_courier_grosze": 1499}'::jsonb
  where key = 'store' and not (value ? 'shipping_courier_grosze');
update settings set value = value || '{"low_stock_threshold": 5}'::jsonb
  where key = 'store' and not (value ? 'low_stock_threshold');
update settings set value = value || '{"announcement": ""}'::jsonb
  where key = 'store' and not (value ? 'announcement');

-- ===== 7. DROBNE =====
-- Throttle ponownej wysyłki maila potwierdzającego newsletter.
alter table newsletter_subscribers add column if not exists confirm_sent_at timestamptz;
-- Szybkie zapytania o niski stan magazynowy.
create index if not exists products_stock_qty_idx on products (stock_qty) where stock_qty is not null;
