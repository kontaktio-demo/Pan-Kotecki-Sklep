# Pan Kotecki

Sklep internetowy (domeny **pankotecki.pl** i **pankotecki.com**) z gadżetami
i zabawkami dla kotów oraz ich właścicieli.
Wersja wizualna (frontend) z w pełni klikalnym przepływem zakupowym na danych
przykładowych. Backend, panel admina i prawdziwa bramka płatności dojdą
w kolejnych etapach.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Inter** (next/font, self-hosted)
- **Zustand** + localStorage (koszyk)
- Cel hostingu: **Vercel** (czyste adresy URL, statyczne strony + SSG produktów)

## Strony

| Ścieżka | Opis |
| --- | --- |
| `/` | Strona główna — banner, pasek zaufania, kategorie, bestsellery, o nas |
| `/sklep` | Klasyczny sklep — filtry (kategorie, cena, dostępność), sortowanie, wyszukiwarka |
| `/sklep/[slug]` | Strona produktu (SSG) — galeria, cena, opinie, dodaj do koszyka |
| `/koszyk` | Koszyk |
| `/kasa` | Kasa — dane, dostawa, płatność, podsumowanie |
| `/kasa/dziekujemy` | Potwierdzenie zamówienia |
| `/o-nas`, `/kontakt` | Strony informacyjne |

Koszyk jest globalny (wysuwany panel + strona). Pełny przepływ: produkt →
koszyk → kasa → potwierdzenie działa od początku do końca (płatność to atrapa).

## Architektura pod backend

Warstwa danych jest odseparowana od UI, więc podłączenie API/bazy to zmiana
w jednym miejscu:

- `lib/products.ts` — typy `Product`/`Category` i dane przykładowe; funkcje
  `getProducts()`, `getProductBySlug()`, `getProductsByCategory()`,
  `getBestsellers()`, `getRelated()` są **async** (dziś czytają z tablicy,
  jutro z API/DB — komponenty bez zmian).
- `store/cart.ts` — koszyk w Zustand z utrwaleniem w `localStorage`.
- Zdjęcia produktów: pole `Product.images` (puste = neutralny placeholder).
  Panel admina będzie wgrywał prawdziwe zdjęcia tutaj — front automatycznie je
  pokaże (`components/shop/ProductMedia.tsx`).

## Uruchomienie

```bash
npm install
npm run dev      # http://localhost:3000
```

Build produkcyjny:

```bash
npm run build
npm start
```

## Zdjęcia

Zdjęcia kotów (banner, kategorie, „o nas") pochodzą z **Pexels** (licencja
darmowa do użytku komercyjnego, bez wymogu atrybucji) i są przechowywane
lokalnie w `public/images/cats`. Zdjęcia produktów to neutralne placeholdery —
docelowe wgrasz w panelu admina.

## Do zrobienia w kolejnych etapach

- Backend + panel admina (CRUD produktów, zdjęcia, stany magazynowe)
- Prawdziwa bramka płatności (np. Przelewy24 / Stripe) w API routes
- Konta użytkowników, historia zamówień, realna wyszukiwarka/filtry po stronie API
