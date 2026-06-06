-- Pan Kotecki — dane startowe (kategorie). Produkty migrujemy skryptem.

insert into categories (slug, name, tagline, sort_order) values
  ('zabawki',         'Zabawki',         'Polowanie, skok, mruczenie — dla kociej energii.', 1),
  ('akcesoria',       'Akcesoria',       'Codzienność kota dopracowana w każdym detalu.',    2),
  ('kubki',           'Kubki',           'Poranna kawa lepiej smakuje z kotem na boku.',     3),
  ('dla-wlasciciela', 'Dla właściciela', 'Noś swoją miłość do kotów — dosłownie.',           4)
on conflict (slug) do nothing;
