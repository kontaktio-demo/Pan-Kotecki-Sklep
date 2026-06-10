import type { Metadata } from "next";
import Link from "next/link";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import JsonLd from "@/components/seo/JsonLd";
import { getPublicSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Najczęstsze pytania (FAQ)",
  description:
    "Dostawa, zwroty, płatności, pielęgnacja produktów i konta - odpowiedzi na najczęstsze pytania w sklepie Pan Kotecki.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const settings = await getPublicSettings();
  const free = `${settings.freeShippingZl} zł`;

  const sections: { title: string; items: { q: string; a: string }[] }[] = [
    {
      title: "Dostawa",
      items: [
        {
          q: "Ile kosztuje dostawa i kiedy jest darmowa?",
          a: `Paczkomat InPost kosztuje ${settings.lockerCostZl.toFixed(2).replace(".", ",")} zł, kurier InPost ${settings.courierCostZl.toFixed(2).replace(".", ",")} zł. Od ${free} dostawa jest darmowa - niezależnie od metody.`,
        },
        {
          q: "Jak szybko wysyłacie zamówienia?",
          a: "Zamówienia opłacone do 12:00 w dni robocze pakujemy i wysyłamy tego samego dnia, pozostałe następnego dnia roboczego. Przesyłka InPost dochodzi zwykle w 1-2 dni robocze.",
        },
        {
          q: "Jak mogę śledzić moją paczkę?",
          a: "Po nadaniu paczki otrzymasz numer przesyłki - znajdziesz go też w zakładce Moje konto > Zamówienia. Wystarczy kliknąć link śledzenia albo wpisać numer na stronie InPost.",
        },
      ],
    },
    {
      title: "Zwroty i reklamacje",
      items: [
        {
          q: "Czy mogę zwrócić produkt?",
          a: "Tak - masz 14 dni od otrzymania paczki na odstąpienie od umowy bez podania przyczyny. Wystarczy wypełnić formularz ze strony Zwroty i odesłać produkt w stanie niezmienionym.",
        },
        {
          q: "Kot się zawiódł. Czy to powód do zwrotu?",
          a: "Koci gust to rzecz święta - 14-dniowy zwrot obejmuje też przypadki, gdy obdarowany okazał się wybredny. Produkt musi być po prostu nieuszkodzony i kompletny.",
        },
        {
          q: "Jak złożyć reklamację?",
          a: "Napisz do nas przez formularz kontaktowy albo na adres e-mail z dowodem zakupu i krótkim opisem problemu. Odpowiadamy w ciągu 14 dni, zwykle dużo szybciej.",
        },
      ],
    },
    {
      title: "Płatności i kody rabatowe",
      items: [
        {
          q: "Jakie metody płatności obsługujecie?",
          a: "BLIK, karty płatnicze (Visa, Mastercard), Przelewy24 oraz Apple Pay / Google Pay. Płatność odbywa się bezpiecznie przez Stripe - bez zakładania konta.",
        },
        {
          q: "Jak użyć kodu rabatowego?",
          a: "W koszyku/kasie znajdziesz pole „Kod rabatowy”. Wpisz kod, kliknij Zastosuj, a rabat od razu pojawi się w podsumowaniu. Kody nie łączą się ze sobą.",
        },
        {
          q: "Czy dostanę potwierdzenie zamówienia?",
          a: "Tak, zaraz po opłaceniu wysyłamy e-mail z numerem zamówienia i podsumowaniem. Status możesz też sprawdzać w Moim koncie.",
        },
      ],
    },
    {
      title: "Produkty i pielęgnacja",
      items: [
        {
          q: "Czy zabawki są bezpieczne dla kota?",
          a: "Tak - wybieramy materiały bez ostrych elementów i toksycznych barwników. Mimo to każda zabawka zużywa się z czasem: sprawdzaj ją regularnie i wymień, gdy zacznie się pruć.",
        },
        {
          q: "Jak prać legowiska i tkaniny?",
          a: "Większość naszych tkanin pierze się w 30°C bez wirowania agresywnego. Szczegóły znajdziesz na metce produktu i w sekcji Szczegóły na stronie produktu.",
        },
        {
          q: "Skąd mam wiedzieć, że produkt się kończy?",
          a: "Przy produktach z niskim stanem magazynowym pokazujemy informację „Zostały X szt.” - wtedy warto się pospieszyć.",
        },
      ],
    },
    {
      title: "Konto i prywatność",
      items: [
        {
          q: "Czy muszę zakładać konto, żeby kupić?",
          a: "Nie - zakupy jako gość działają w pełni. Konto (logowanie linkiem na e-mail, bez hasła) daje dodatkowo historię zamówień, książkę adresową, ulubione i szybsze zakupy.",
        },
        {
          q: "Jak dodać opinię o produkcie?",
          a: "Opinie przyjmujemy tylko od osób, które kupiły dany produkt. Zalogowani klikają „Napisz opinię” na stronie produktu; goście podają dodatkowo numer zamówienia i e-mail z zakupu.",
        },
        {
          q: "Jak usunąć konto i moje dane?",
          a: "W zakładce Moje konto > Dane konta znajdziesz przycisk usunięcia konta (RODO). Dane znikają od razu; zamówienia zostają w systemie wyłącznie na potrzeby księgowe.",
        },
      ],
    },
  ];

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: sections.flatMap((s) =>
      s.items.map((i) => ({
        "@type": "Question",
        name: i.q,
        acceptedAnswer: { "@type": "Answer", text: i.a },
      })),
    ),
  };

  return (
    <div className="container-edge pb-24 pt-6 md:pt-8">
      <JsonLd data={faqLd} />
      <nav className="flex items-center gap-2 text-sm text-ash">
        <Link href="/" className="transition-colors hover:text-ink">Strona główna</Link>
        <span>/</span>
        <span className="text-ink">FAQ</span>
      </nav>

      <div className="mx-auto mt-6 max-w-3xl">
        <p className="eyebrow text-orange-deep">Pomoc</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Najczęstsze pytania</h1>
        <p className="mt-3 text-ink-soft">
          Krótko i konkretnie - a jeśli nie znajdziesz odpowiedzi,{" "}
          <Link href="/kontakt" className="font-medium text-coral underline-offset-2 hover:underline">
            napisz do nas
          </Link>
          . Odpowiada człowiek, nie kot (kot tylko nadzoruje).
        </p>

        <p className="paw-rule my-8" aria-hidden="true" />

        {sections.map((s) => (
          <section key={s.title} className="mb-10">
            <h2 className="mb-2 text-xl font-semibold">{s.title}</h2>
            <Accordion>
              {s.items.map((i) => (
                <AccordionItem key={i.q} question={i.q}>
                  {i.a}
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}

        <div className="rounded-2xl bg-cream p-6 text-center">
          <p className="font-medium">Nadal masz pytanie?</p>
          <p className="mt-1 text-sm text-ink-soft">Napisz - odpowiadamy szybko i po ludzku.</p>
          <Link
            href="/kontakt"
            className="tap mt-4 inline-block rounded-xl bg-ink px-7 py-3 text-sm font-semibold text-milk transition-colors hover:bg-coral"
          >
            Przejdź do kontaktu
          </Link>
        </div>
      </div>
    </div>
  );
}
