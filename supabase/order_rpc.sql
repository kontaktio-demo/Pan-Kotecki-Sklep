-- Pan Kotecki — atomowe składanie zamówienia.
-- Jedna funkcja = jedna transakcja Postgres → brak oversell i wyścigów (TOCTOU).
-- Ceny, rabat i dostawę liczy backend (z danych z bazy); tutaj egzekwujemy
-- ATOMOWO stan magazynowy i limit użyć kodu rabatowego, a potem zapisujemy zamówienie.
--
-- Wklej w Supabase SQL Editor i uruchom. Idempotentne (create or replace).

-- Kolumna na id przesyłki InPost (do generowania etykiet z panelu).
alter table orders add column if not exists shipping_ref text;

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
  -- 1) Atomowy, warunkowy dekrement stanu dla każdej pozycji.
  --    stock_qty = NULL → produkt nielimitowany (pomijamy).
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

  -- 2) Atomowy licznik użyć promocji (jeśli przekazana).
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

  -- 3) Zamówienie.
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

  -- 4) Pozycje zamówienia.
  insert into order_items (order_id, product_id, slug, name, price_grosze, qty, image_url)
  select
    v_order,
    (it->>'product_id')::uuid,
    it->>'slug',
    it->>'name',
    (it->>'price_grosze')::int,
    (it->>'qty')::int,
    nullif(it->>'image_url', '')
  from jsonb_array_elements(p->'items') as it;

  return jsonb_build_object('order_id', v_order, 'number', v_number);
end;
$$;

-- Funkcję wywołuje wyłącznie backend (klucz service_role). Odbieramy dostęp anonom.
revoke all on function create_order(jsonb) from public, anon, authenticated;
grant execute on function create_order(jsonb) to service_role;

-- Zwolnienie zamówienia (porzucona/odrzucona płatność): zwrot stanu magazynowego
-- i licznika promocji, oznaczenie jako anulowane. Wywołuje webhook Stripe.
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
