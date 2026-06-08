-- =============================================================
-- Pan Kotecki - HARDENING + SKALOWALNOŚĆ (audyt przedpremierowy).
-- Wklej całość do Supabase SQL Editor i RUN. Idempotentne (bezpieczne
-- na istniejącej bazie, można puścić ponownie). Uruchom PO setup_all.sql.
-- =============================================================

create extension if not exists "pgcrypto";

-- ===== 1. INDEKSY POD RUCH (tysiące zamówień) =====
-- Hot-path lookups, raporty i wyszukiwarka - żeby nie było seq-scanów.
create index if not exists orders_customer_idx       on orders (customer_id);
create index if not exists orders_email_plain_idx     on orders (email);
create index if not exists orders_status_created_idx  on orders (status, created_at desc);
-- partial: dominujący filtr raportów to payment_status='paid'
create index if not exists orders_paid_created_idx    on orders (created_at) where payment_status = 'paid';
-- webhook zwrotu/sporu: orders.select().eq('payment_ref', pi) - inaczej seq-scan na każdym zdarzeniu
create index if not exists orders_payment_ref_idx     on orders (payment_ref);
create index if not exists customers_email_plain_idx  on customers (email);

-- Wyszukiwarka produktów ILIKE '%fraza%' - indeks trigramowy (GIN)
create extension if not exists pg_trgm;
create index if not exists products_name_trgm on products using gin (name gin_trgm_ops);
create index if not exists products_desc_trgm on products using gin (short_description gin_trgm_ops);

-- ===== 2. search_path PIN na set_updated_at (gdyby baza miała wariant ze schema.sql) =====
create or replace function set_updated_at() returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===== 3. RLS: nie wystawiaj obrazów NIEAKTYWNYCH produktów =====
drop policy if exists "public read product images" on product_images;
create policy "public read product images" on product_images
  for select using (
    exists (select 1 from products p where p.id = product_images.product_id and p.active = true)
  );

-- ===== 4. Zgoda marketingowa - znacznik czasu (dowód zgody, RODO) =====
alter table account_profiles add column if not exists marketing_consent_at timestamptz;

-- ===== 5. RODO: atomowe, KOMPLETNE usunięcie konta =====
-- Usuwa profil + adresy + NIE-księgowy rekord PII w `customers` (email/imię/telefon),
-- odpina zamówienia (zostają dla księgowości). Wołane przez backend po weryfikacji.
create or replace function delete_customer_account(p_user uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user is not null then
    delete from account_addresses where user_id = p_user;
    delete from account_profiles  where user_id = p_user;
    update orders set user_id = null where user_id = p_user;
  end if;
  if p_email is not null and length(p_email) > 0 then
    -- `customers` to kopia danych identyfikujących (nie dokument księgowy) - kasujemy.
    delete from customers where lower(email) = lower(p_email);
  end if;
end;
$$;
revoke all on function delete_customer_account(uuid, text) from public, anon, authenticated;
grant execute on function delete_customer_account(uuid, text) to service_role;

-- ===== 6. Zwrot/chargeback Stripe: przywróć stan + licznik promocji =====
-- release_order obsługuje tylko nieopłacone; to jest dla OPŁACONYCH → 'refunded'.
create or replace function refund_order(p_order uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  it        record;
  v_promo   text;
  v_payment text;
begin
  select payment_status, promo_code into v_payment, v_promo from orders where id = p_order for update;
  if not found then return; end if;
  if v_payment = 'refunded' then return; end if;

  for it in select product_id, qty from order_items where order_id = p_order loop
    update products set stock_qty = stock_qty + it.qty where id = it.product_id and stock_qty is not null;
  end loop;
  if v_promo is not null then
    update promotions set used_count = greatest(used_count - 1, 0) where code = v_promo;
  end if;

  update orders set status = 'refunded', payment_status = 'refunded' where id = p_order;
end;
$$;
revoke all on function refund_order(uuid) from public, anon, authenticated;
grant execute on function refund_order(uuid) to service_role;

-- ===== 7. Wiadomości z formularza kontaktowego (żeby nic nie ginęło) =====
create table if not exists contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text,
  subject    text,
  message    text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table contact_messages enable row level security; -- brak polityk → tylko backend (service_role)
create index if not exists contact_messages_created_idx on contact_messages (created_at desc);

-- ===== 8. Zapisy do newslettera (z dowodem zgody) =====
create table if not exists newsletter_subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  consent       boolean not null default true,
  consent_at    timestamptz not null default now(),
  source        text,
  confirmed     boolean not null default false,  -- double opt-in
  confirm_token text,                            -- jednorazowy token potwierdzenia
  unsub_token   text,                            -- stały token „wypisz się"
  created_at    timestamptz not null default now()
);
-- dla istniejących baz (gdy tabela była już utworzona):
alter table newsletter_subscribers add column if not exists confirm_token text;
alter table newsletter_subscribers add column if not exists unsub_token text;
update newsletter_subscribers set unsub_token = encode(gen_random_bytes(16), 'hex') where unsub_token is null;
create unique index if not exists newsletter_email_uidx on newsletter_subscribers (lower(email));
alter table newsletter_subscribers enable row level security; -- tylko backend

-- ===== 9. (OPCJONALNE, pod DUŻĄ skalę) agregaty statystyk w SQL =====
-- Gdy zamówień będzie > kilka tysięcy, przełącz panel na te funkcje zamiast
-- liczenia w JS. Bezpieczne do założenia teraz (backend może ich użyć później).
create or replace function admin_account_stats()
returns table(user_id uuid, orders int, spent_grosze bigint)
language sql security definer set search_path = public, pg_temp as $$
  select user_id, count(*)::int,
         coalesce(sum(total_grosze) filter (where payment_status = 'paid'), 0)::bigint
  from orders where user_id is not null group by user_id
$$;
revoke all on function admin_account_stats() from public, anon, authenticated;
grant execute on function admin_account_stats() to service_role;
