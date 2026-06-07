import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Zwroty i reklamacje",
  description: "Zasady zwrotów (14 dni) i reklamacji w sklepie Pan Kotecki.",
};

const SELLER = {
  name: "Kontaktio Bartosz Fiks",
  address: "ul. Brzezińska 84, 95-020 Bedoń-Wieś",
  nip: "7282909882",
  regon: "544475638",
  email: "biuro@pankotecki.pl",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      <div className="flex flex-col gap-2 leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

export default function ZwrotyPage() {
  return (
    <>
      <PageHeader eyebrow="Informacje" title="Zwroty i reklamacje" />
      <div className="container-edge max-w-3xl pb-24">
        <p className="text-sm text-ash">Twoje prawa jako Konsumenta — jasno i po ludzku 🐾</p>

        <Section title="Zwrot (odstąpienie od umowy) — 14 dni">
          <p>
            Jako Konsument możesz odstąpić od umowy <strong>bez podania przyczyny w terminie 14 dni</strong> od dnia
            otrzymania produktu. Aby zachować termin, wystarczy wysłać oświadczenie przed jego upływem.
          </p>
          <ol className="ml-5 list-decimal">
            <li>
              Napisz do nas na <strong>{SELLER.email}</strong> (możesz użyć formularza poniżej) — podaj numer zamówienia.
            </li>
            <li>Odeślij produkt na adres: {SELLER.name}, {SELLER.address} — w terminie 14 dni od złożenia oświadczenia.</li>
            <li>Zwrócimy pieniądze tą samą metodą płatności, w ciągu 14 dni.</li>
          </ol>
        </Section>

        <Section title="Koszt i stan zwracanego towaru">
          <p>
            <strong>Bezpośredni koszt odesłania produktu ponosi Klient.</strong> Produkt powinien zostać zwrócony w
            stanie niezmienionym (możesz go sprawdzić tak, jak w sklepie stacjonarnym). Odpowiadasz za zmniejszenie
            wartości rzeczy wynikające z używania jej ponad konieczne sprawdzenie.
          </p>
          <p>
            Zgodnie z prawem możemy <strong>wstrzymać zwrot płatności</strong> do chwili otrzymania produktu z powrotem
            lub dostarczenia dowodu jego odesłania — w zależności co nastąpi wcześniej.
          </p>
        </Section>

        <Section title="Kiedy prawo do zwrotu nie przysługuje">
          <p>
            Prawo odstąpienia nie przysługuje m.in. dla produktów dostarczanych w zapieczętowanym opakowaniu, których po
            otwarciu nie można zwrócić ze względów higienicznych (np. otwarta karma/przysmaki), produktów wykonanych na
            indywidualne zamówienie oraz w innych przypadkach z art. 38 ustawy o prawach konsumenta.
          </p>
        </Section>

        <Section title="Reklamacja (niezgodność towaru z umową)">
          <p>
            Jeśli produkt jest wadliwy lub niezgodny z umową, masz prawo do reklamacji. Zgłoś ją na {SELLER.email},
            opisując problem i dołączając zdjęcia. <strong>Rozpatrzymy reklamację w ciągu 14 dni.</strong> W pierwszej
            kolejności możemy naprawić lub wymienić produkt; gdy nie jest to możliwe — obniżymy cenę lub zwrócimy
            pieniądze.
          </p>
        </Section>

        <Section title="Wzór formularza odstąpienia od umowy">
          <div className="rounded-2xl border border-line bg-cream/60 p-5 text-sm">
            <p className="text-ash">— Adresat: {SELLER.name}, {SELLER.address}, {SELLER.email}</p>
            <p className="mt-2">
              Ja, niżej podpisany/a, niniejszym odstępuję od umowy sprzedaży następujących produktów: …………………………
            </p>
            <p className="mt-2">Numer zamówienia: ………………… · Data zamówienia/odbioru: …………………</p>
            <p className="mt-2">Imię i nazwisko: ………………… · Adres: …………………</p>
            <p className="mt-2">Numer konta do zwrotu (jeśli inny niż płatność): …………………</p>
            <p className="mt-2">Data i podpis (jeśli papierowo): …………………</p>
          </div>
        </Section>

        <Section title="Pozasądowe rozwiązywanie sporów">
          <p>
            Konsument może skorzystać z platformy ODR Komisji Europejskiej:{" "}
            <a href="https://ec.europa.eu/consumers/odr" className="text-orange-deep underline" target="_blank" rel="noreferrer">
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>
        </Section>

        <p className="mt-10 rounded-xl bg-cream px-4 py-3 text-xs text-ash">
          🐾 Terminy zgodne z ustawą o prawach konsumenta (14 dni to ustawowe minimum). Uzupełnij dane firmy w nawiasach.
        </p>
      </div>
    </>
  );
}
