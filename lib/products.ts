export type CategorySlug =
  | "zabawki"
  | "akcesoria"
  | "kubki"
  | "dla-wlasciciela";

export type Category = {
  slug: CategorySlug;
  name: string;
  tagline: string;
};

export type ProductVisual = {
  motif: string;
  tone: string;
};

export type Product = {
  slug: string;
  name: string;
  category: CategorySlug;
  price: number;
  currency: "PLN";
  visual: ProductVisual;
  images?: string[];
  shortDescription: string;
  description: string;
  details: string[];
  badges?: string[];
  bestseller?: boolean;
  inStock: boolean;
};

const CATEGORIES: Category[] = [
  {
    slug: "zabawki",
    name: "Zabawki",
    tagline: "Polowanie, skok, mruczenie — dla kociej energii.",
  },
  {
    slug: "akcesoria",
    name: "Akcesoria",
    tagline: "Codzienność kota dopracowana w każdym detalu.",
  },
  {
    slug: "kubki",
    name: "Kubki",
    tagline: "Poranna kawa lepiej smakuje z kotem na boku.",
  },
  {
    slug: "dla-wlasciciela",
    name: "Dla właściciela",
    tagline: "Noś swoją miłość do kotów — dosłownie.",
  },
];

const PRODUCTS: Product[] = [
  {
    slug: "mysz-fela",
    name: "Mysz na sznurku „Fela”",
    category: "zabawki",
    price: 24,
    currency: "PLN",
    visual: { motif: "mouse", tone: "coral" },
    shortDescription: "Klasyk, którego żaden kot nie ignoruje.",
    description:
      "Miękka mysz z naturalnym sznurkiem i szczyptą kocimiętki w środku. Lekka, idealnie wyważona do podrzucania i łapania. Sprawdza się w samotnej zabawie i w pojedynku z wędką.",
    details: ["Wymiary: 7 cm + 20 cm sznurek", "Wypełnienie z kocimiętką", "Materiał: filc i bawełna"],
    badges: ["Bestseller"],
    bestseller: true,
    inStock: true,
  },
  {
    slug: "wedka-lowca",
    name: "Wędka z piórkiem „Łowca”",
    category: "zabawki",
    price: 39,
    currency: "PLN",
    visual: { motif: "wand", tone: "ink" },
    shortDescription: "Wyzwala instynkt łowcy w trzy sekundy.",
    description:
      "Elastyczny pręt, długa linka i piórka, które tańczą przy najmniejszym ruchu. Stworzona do wspólnej zabawy, która rozrusza nawet leniwego kanapowca.",
    details: ["Długość pręta: 45 cm", "Wymienne piórka", "Antypoślizgowy uchwyt"],
    bestseller: true,
    inStock: true,
  },
  {
    slug: "pilki-dzwoneczek",
    name: "Piłki z dzwoneczkiem (3-pak)",
    category: "zabawki",
    price: 19,
    currency: "PLN",
    visual: { motif: "ball", tone: "sand" },
    shortDescription: "Trzy kolory, jeden cel — gonić.",
    description:
      "Lekkie, ażurowe piłki z dzwoneczkiem w środku. Toczą się nieprzewidywalnie po podłodze i potrafią zająć kota na długie minuty.",
    details: ["3 sztuki", "Średnica: 4 cm", "Cichy dzwoneczek"],
    inStock: true,
  },
  {
    slug: "tunel-jaskinia",
    name: "Tunel składany „Jaskinia”",
    category: "zabawki",
    price: 89,
    currency: "PLN",
    visual: { motif: "tunnel", tone: "warm" },
    shortDescription: "Kryjówka, zasadzka i tor wyścigowy w jednym.",
    description:
      "Składany tunel z szeleszczącą warstwą i okienkiem do zaczepek. Rozkłada się w sekundę, a po zabawie chowa na płasko. Łączy się z innymi tunelami w cały labirynt.",
    details: ["Długość: 90 cm", "Składany, na płasko", "Szeleszcząca wyściółka"],
    bestseller: true,
    inStock: true,
  },
  {
    slug: "kopak-kocimietka",
    name: "Kopak z kocimiętką „Banan”",
    category: "zabawki",
    price: 29,
    currency: "PLN",
    visual: { motif: "kicker", tone: "mist" },
    shortDescription: "Do przytulania, kopania i obejmowania łapami.",
    description:
      "Wydłużony kopak wypełniony kocimiętką, w sam raz do chwytania przednimi łapami i młócenia tylnymi. Klasyczna forma zabawy, która rozładowuje kocią energię.",
    details: ["Długość: 23 cm", "Naturalna kocimiętka", "Wytrzymały szew"],
    inStock: true,
  },

  {
    slug: "legowisko-chmurka",
    name: "Legowisko „Chmurka”",
    category: "akcesoria",
    price: 159,
    currency: "PLN",
    visual: { motif: "bed", tone: "cool" },
    shortDescription: "Miękkie gniazdo, z którego nie chce się wychodzić.",
    description:
      "Okrągłe legowisko z wysokim, miękkim rantem dającym poczucie bezpieczeństwa. Wyjmowana poduszka, przyjemny w dotyku materiał i dno antypoślizgowe.",
    details: ["Średnica: 50 cm", "Zdejmowana poszewka", "Pranie w 30°C"],
    badges: ["Bestseller"],
    bestseller: true,
    inStock: true,
  },
  {
    slug: "miska-lapka",
    name: "Miska ceramiczna „Łapka”",
    category: "akcesoria",
    price: 49,
    currency: "PLN",
    visual: { motif: "bowl", tone: "sand" },
    shortDescription: "Płytka miska, która szanuje kocie wąsy.",
    description:
      "Szeroka, niska miska z wypalanej ceramiki — bez podrażniania wąsów. Stabilna podstawa i powierzchnia łatwa do utrzymania w czystości.",
    details: ["Pojemność: 250 ml", "Ceramika szkliwiona", "Można myć w zmywarce"],
    inStock: true,
  },
  {
    slug: "fontanna-zrodlo",
    name: "Fontanna do picia „Źródło”",
    category: "akcesoria",
    price: 199,
    currency: "PLN",
    visual: { motif: "fountain", tone: "cool" },
    shortDescription: "Świeża, krążąca woda zachęca do picia.",
    description:
      "Cicha fontanna z filtrem, która utrzymuje wodę w ruchu i świeżości. Delikatny szum zachęca kota do częstszego picia — wsparcie dla nerek i nawodnienia.",
    details: ["Pojemność: 2 l", "Cichy silnik", "Filtr węglowy w zestawie"],
    bestseller: true,
    inStock: true,
  },
  {
    slug: "drapak-wieza",
    name: "Drapak słupek „Wieża”",
    category: "akcesoria",
    price: 219,
    currency: "PLN",
    visual: { motif: "scratcher", tone: "warm" },
    shortDescription: "Punkt widokowy i drapak w jednym.",
    description:
      "Stabilny słupek owinięty sizalem, zwieńczony platformą do obserwacji świata. Ratuje kanapę i daje kotu jego własne, wysokie miejsce.",
    details: ["Wysokość: 80 cm", "Naturalny sizal", "Stabilna podstawa"],
    inStock: true,
  },
  {
    slug: "obroza-dzwonek",
    name: "Obroża z zawieszką „Dzwonek”",
    category: "akcesoria",
    price: 35,
    currency: "PLN",
    visual: { motif: "collar", tone: "coral" },
    shortDescription: "Bezpieczne zapięcie, miejsce na adresówkę.",
    description:
      "Miękka obroża z zapięciem bezpieczeństwa, które puszcza pod naciskiem. Regulowana, z zawieszką na adres i dyskretnym dzwoneczkiem.",
    details: ["Regulacja: 20–30 cm", "Zapięcie bezpieczeństwa", "Miejsce na adresówkę"],
    inStock: true,
  },
  {
    slug: "transporter-wyprawa",
    name: "Transporter „Wyprawa”",
    category: "akcesoria",
    price: 149,
    currency: "PLN",
    visual: { motif: "carrier", tone: "ink" },
    shortDescription: "Spokojna podróż do weterynarza i dalej.",
    description:
      "Lekki, dobrze wentylowany transporter z miękkim wnętrzem i pewnym zapięciem. Górne otwarcie ułatwia wkładanie nieprzekonanego pasażera.",
    details: ["Do 7 kg", "Wentylacja z trzech stron", "Składany"],
    inStock: true,
  },
  {
    slug: "szczotka-wyczesujaca",
    name: "Szczotka wyczesująca „Gładko”",
    category: "akcesoria",
    price: 39,
    currency: "PLN",
    visual: { motif: "brush", tone: "mist" },
    shortDescription: "Mniej sierści na kanapie, więcej na szczotce.",
    description:
      "Szczotka z chowanymi zębami — jednym kliknięciem usuwasz zebraną sierść. Delikatna dla skóry, skuteczna w usuwaniu martwego podszerstka.",
    details: ["Chowane zęby", "Ergonomiczny uchwyt", "Do każdej długości włosa"],
    inStock: true,
  },

  {
    slug: "kubek-poranny-mruczek",
    name: "Kubek „Poranny Mruczek”",
    category: "kubki",
    price: 59,
    currency: "PLN",
    visual: { motif: "mug", tone: "coral" },
    shortDescription: "Pierwsza kawa i kot na parapecie.",
    description:
      "Pojemny kubek z grubej ceramiki z minimalistycznym kocim motywem. Przyjemny w dłoni, długo trzyma ciepło. Do kawy, herbaty i porannego wpatrywania się w okno.",
    details: ["Pojemność: 350 ml", "Ceramika", "Można myć w zmywarce"],
    badges: ["Bestseller"],
    bestseller: true,
    inStock: true,
  },
  {
    slug: "kubek-termiczny-w-drodze",
    name: "Kubek termiczny „W drodze”",
    category: "kubki",
    price: 89,
    currency: "PLN",
    visual: { motif: "thermo", tone: "ink" },
    shortDescription: "Ciepła kawa przez całą poranną trasę.",
    description:
      "Stalowy kubek termiczny z izolacją próżniową i szczelnym wieczkiem. Utrzymuje temperaturę godzinami i mieści się w uchwycie samochodowym.",
    details: ["Pojemność: 450 ml", "Stal nierdzewna", "Szczelne wieczko"],
    inStock: true,
  },
  {
    slug: "kubki-on-i-kot",
    name: "Zestaw 2 kubki „On i Kot”",
    category: "kubki",
    price: 99,
    currency: "PLN",
    visual: { motif: "mugpair", tone: "sand" },
    shortDescription: "Dwa kubki, jedna wspólna poranna rutyna.",
    description:
      "Para kubków w spójnym, minimalnym stylu — jeden dla Ciebie, drugi dla wielbiciela kotów obok. Świetny pomysł na prezent.",
    details: ["2 sztuki po 300 ml", "Ceramika", "W pudełku prezentowym"],
    inStock: true,
  },

  {
    slug: "torba-crazy-cat",
    name: "Torba płócienna „Crazy Cat”",
    category: "dla-wlasciciela",
    price: 45,
    currency: "PLN",
    visual: { motif: "tote", tone: "warm" },
    shortDescription: "Zakupy, książki i koci manifest na ramieniu.",
    description:
      "Mocna bawełniana torba z minimalnym nadrukiem. Długie ucha, pojemne wnętrze i charakter, który mówi wszystko bez słów.",
    details: ["Bawełna 280 g/m²", "Wymiary: 38 × 42 cm", "Długie ucha"],
    bestseller: true,
    inStock: true,
  },
  {
    slug: "skarpetki-lapki",
    name: "Skarpetki „Łapki” (2-pak)",
    category: "dla-wlasciciela",
    price: 29,
    currency: "PLN",
    visual: { motif: "socks", tone: "mist" },
    shortDescription: "Kocie łapki na Twoich stopach.",
    description:
      "Miękkie, oddychające skarpetki z dyskretnym motywem łapek. Dwie pary w pudełku — dla siebie albo na prezent.",
    details: ["2 pary", "Bawełna z domieszką elastanu", "Rozmiar uniwersalny 38–43"],
    inStock: true,
  },
  {
    slug: "przypinka-kot",
    name: "Przypinka emaliowana „Kot”",
    category: "dla-wlasciciela",
    price: 19,
    currency: "PLN",
    visual: { motif: "pin", tone: "coral" },
    shortDescription: "Mały detal, wielka deklaracja.",
    description:
      "Emaliowana przypinka z sylwetką kota i mocnym zapięciem motylkowym. Idealna na kurtkę, plecak albo płócienną torbę.",
    details: ["Wymiary: 2,5 cm", "Twarda emalia", "Zapięcie motylkowe"],
    inStock: true,
  },
  {
    slug: "notes-dziennik-kota",
    name: "Notes „Dziennik Kota”",
    category: "dla-wlasciciela",
    price: 35,
    currency: "PLN",
    visual: { motif: "notebook", tone: "cool" },
    shortDescription: "Na notatki, plany i kocie obserwacje.",
    description:
      "Notes w twardej oprawie z gładkim papierem i wstążką-zakładką. Minimalna okładka z kocim akcentem. Leży płasko po otwarciu.",
    details: ["Format A5", "192 strony", "Gumka i zakładka"],
    inStock: true,
  },
  {
    slug: "bluza-mow-do-kota",
    name: "Bluza „Mów do kota”",
    category: "dla-wlasciciela",
    price: 159,
    currency: "PLN",
    visual: { motif: "hoodie", tone: "ink" },
    shortDescription: "Miękka bluza dla zespołu „kot ważniejszy”.",
    description:
      "Ciężka, miękka w środku bluza z kapturem i drobnym haftem. Krój oversize, materiał, z którego nie chce się wychodzić — zupełnie jak kot z legowiska.",
    details: ["Bawełna z pętelką 320 g/m²", "Krój oversize", "Rozmiary S–XXL"],
    inStock: true,
  },
];

const delay = () => Promise.resolve();

export async function getCategories(): Promise<Category[]> {
  await delay();
  return CATEGORIES;
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  await delay();
  return CATEGORIES.find((c) => c.slug === slug);
}

export async function getProducts(): Promise<Product[]> {
  await delay();
  return PRODUCTS;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  await delay();
  return PRODUCTS.find((p) => p.slug === slug);
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  await delay();
  return PRODUCTS.filter((p) => p.category === category);
}

export async function getBestsellers(limit = 6): Promise<Product[]> {
  await delay();
  return PRODUCTS.filter((p) => p.bestseller).slice(0, limit);
}

export async function getRelated(slug: string, limit = 3): Promise<Product[]> {
  await delay();
  const current = PRODUCTS.find((p) => p.slug === slug);
  if (!current) return PRODUCTS.slice(0, limit);
  return PRODUCTS.filter(
    (p) => p.category === current.category && p.slug !== slug,
  ).slice(0, limit);
}

export function categoryName(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}
