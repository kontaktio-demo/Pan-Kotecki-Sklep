import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description: "Polityka prywatności i informacja o cookies sklepu Pan Kotecki.",
};

const ADMIN = {
  name: "Pan Kotecki [nazwa firmy / imię i nazwisko]",
  address: "[ulica, kod pocztowy, miasto]",
  email: "kontakt@kotecki.pl",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      <div className="flex flex-col gap-2 leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Informacje" title="Polityka prywatności" />
      <div className="container-edge max-w-3xl pb-24">
        <p className="text-sm text-ash">Ostatnia aktualizacja: czerwiec 2026.</p>

        <Section title="1. Administrator danych">
          <p>
            Administratorem Twoich danych osobowych jest {ADMIN.name}, {ADMIN.address}. Kontakt w sprawie danych:{" "}
            {ADMIN.email}.
          </p>
        </Section>

        <Section title="2. Jakie dane i w jakim celu">
          <p>Przetwarzamy dane, które podajesz przy zamówieniu (imię, nazwisko, e-mail, telefon, adres dostawy), w celu:</p>
          <ul className="ml-5 list-disc">
            <li>realizacji zamówienia i umowy sprzedaży (art. 6 ust. 1 lit. b RODO),</li>
            <li>wypełnienia obowiązków podatkowo-księgowych (art. 6 ust. 1 lit. c RODO),</li>
            <li>obsługi reklamacji i ewentualnych roszczeń (art. 6 ust. 1 lit. f RODO).</li>
          </ul>
        </Section>

        <Section title="3. Odbiorcy danych">
          <p>
            Dane przekazujemy wyłącznie podmiotom niezbędnym do realizacji zamówienia: operatorowi płatności (Stripe),
            firmie kurierskiej (InPost) oraz dostawcy hostingu/bazy danych. Nie sprzedajemy Twoich danych.
          </p>
        </Section>

        <Section title="4. Okres przechowywania">
          <p>
            Dane przechowujemy przez czas realizacji zamówienia oraz okres wymagany przepisami (m.in. podatkowymi) i
            przedawnienia roszczeń.
          </p>
        </Section>

        <Section title="5. Twoje prawa">
          <p>
            Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia oraz
            wniesienia sprzeciwu. Możesz też złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (UODO).
          </p>
        </Section>

        <Section title="6. Pliki cookies">
          <p>
            Sklep używa niezbędnych plików cookies oraz pamięci przeglądarki (localStorage) do działania koszyka i
            podstawowych funkcji. Nie używamy cookies marketingowych bez Twojej zgody. Możesz zarządzać cookies w
            ustawieniach przeglądarki.
          </p>
        </Section>

        <p className="mt-10 rounded-xl bg-cream px-4 py-3 text-xs text-ash">
          🐾 To szablon startowy. Uzupełnij dane administratora i dostosuj do faktycznego zakresu przetwarzania.
        </p>
      </div>
    </>
  );
}
