# kotecki.pl — projekt wizualny sklepu (spec)

Data: 2026-06-06

## Cel

Sklep internetowy z gadżetami dla właścicieli kotów i zabawkami dla kotów
(kubki, akcesoria itp.). Na tym etapie budujemy wyłącznie warstwę wizualną
(frontend) z gotowym przepływem zakupowym na danych przykładowych. Backend,
panel admina i bramka płatności dochodzą w kolejnych etapach.

Priorytety: efekt „wow", przejrzystość i minimalizm w stylu lusion.co,
oraz skalowalność (łatwe podpięcie API/DB/płatności bez przebudowy frontu).

## Decyzje (zatwierdzone)

- Paleta: **Mleko & Grafit** — mleko `#F6F6F4`, grafit `#141414`,
  akcent koral `#FF6B5C`, plus skala szarości. Świeżo, nowocześnie, lekko
  zabawnie. Dużo powietrza, ostra typografia, jeden zdecydowany akcent.
- Zakres: **pełny szkielet sklepu** — landing + `/sklep` + strona produktu
  + wysuwany koszyk.
- Hero: **edytorialny + parallax** — wielka typografia, kinowy parallax,
  płynne reveal'e przy scrollu, magnetyczny kursor.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS (tokeny kolorów/typografii w konfiguracji)
- GSAP + ScrollTrigger (reveal'e, parallax)
- Lenis (smooth scroll)
- Zustand + localStorage (koszyk)
- Fonty: Clash Display (nagłówki) + General Sans (tekst) z Fontshare,
  hostowane lokalnie w `/public/fonts`
- Cel hostingu: Vercel

## Architektura skalowalna

Najważniejsza rzecz pod przyszły backend — warstwa danych odseparowana od UI:

- `lib/products.ts` — typy `Product`, `Category` oraz dane przykładowe jako
  jedyne źródło prawdy. Eksportowane funkcje są **async**:
  `getProducts()`, `getProductBySlug(slug)`, `getProductsByCategory(cat)`,
  `getCategories()`, `getBestsellers()`. Dziś czytają z tablicy w pliku;
  jutro czytają z API/DB — komponenty się nie zmieniają.
- `store/cart.ts` — koszyk w Zustand z utrwaleniem w localStorage. Działa bez
  backendu; gotowy pod checkout (ilości, warianty, suma).
- Komponenty modularne w `components/` (UI, sekcje landingu, sklep, layout).
- `/admin` oraz bramka płatności wpinają się później jako osobne trasy /
  API routes, bez przebudowy istniejących stron.

## Model danych (wstępny)

```ts
type Category = { slug: string; name: string; tagline: string };
type Product = {
  slug: string;
  name: string;
  category: string;       // Category.slug
  price: number;          // grosze lub PLN — ustalone w implementacji
  currency: 'PLN';
  images: string[];       // ścieżki w /public
  shortDescription: string;
  description: string;
  badges?: string[];      // np. 'Bestseller', 'Nowość'
  bestseller?: boolean;
  inStock: boolean;
};
```

Kategorie startowe: Zabawki, Akcesoria, Kubki, Dla właściciela.

## Strony i trasy

- `/` — imersyjny landing:
  preloader (licznik) → hero (wielki typ + parallax) → marquee →
  bestsellery (asymetryczna siatka, hover reveal) → kategorie →
  sekcja „dlaczego my" (scroll reveals) → editorial/lookbook →
  newsletter → duża stopka.
- `/sklep` — siatka produktów + filtry kategorii + sortowanie, płynne reveal'e.
- `/sklep/[slug]` — strona produktu: galeria, cena, „dodaj do koszyka",
  produkty powiązane.
- `/o-nas`, `/kontakt` — lekkie stuby w tym samym języku wizualnym.
- Wysuwany koszyk (drawer) globalnie + trasa `/koszyk`.

## Interakcje / „wow"

Custom magnetyczny kursor, smooth scroll (Lenis), scroll-triggered reveals,
parallax na obrazach, animowane marquee, hover na produktach (skala + koral),
przejścia między stronami, magnetyczne przyciski. Tasteful — nie przytłacza,
respektuje `prefers-reduced-motion`.

## Obrazy

Zestaw darmowych, dobrych zdjęć (koty + produkty) pobrany lokalnie do
`/public`, plus spójne placeholdery — sklep jest samowystarczalny. Realne
zdjęcia produktów wejdą wraz z produktami w kolejnym etapie.

## Zasady kodu

Czysto, profesjonalnie, bez komentarzy w kodzie, zero „znaków AI".
Pliki skupione (raczej < ~300 linii). README z instrukcją uruchomienia.
Responsywność i podstawowa dostępność (focus, alt, reduced-motion).

## Poza zakresem (na teraz)

Backend, panel admina, prawdziwa baza danych, bramka płatności, logowanie,
realny stan magazynowy. Front jest pod to przygotowany, ale nie implementujemy.
