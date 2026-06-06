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
