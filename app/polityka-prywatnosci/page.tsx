import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description: "Polityka prywatności i informacja o cookies sklepu Pan Kotecki.",
};

const ADMIN = {
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

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Informacje" title="Polityka prywatności" />
      <div className="container-edge max-w-3xl pb-24">
        <p className="text-sm text-ash">Ostatnia aktualizacja: czerwiec 2026.</p>

        <Section title="1. Administrator danych">
          <p>
            Administratorem Twoich danych osobowych jest {ADMIN.name} (NIP: {ADMIN.nip}, REGON: {ADMIN.regon}),{" "}
            {ADMIN.address}, prowadzący sklep internetowy „Pan Kotecki”. Kontakt w sprawie danych: {ADMIN.email}.
          </p>
        </Section>

        <Section title="2. Jakie dane i w jakim celu">
          <p>Przetwarzamy dane, które podajesz przy zamówieniu (imię, nazwisko, e-mail, telefon, adres dostawy), w celu:</p>
          <ul className="ml-5 list-disc">
            <li>realizacji zamówienia i umowy sprzedaży (art. 6 ust. 1 lit. b RODO),</li>
            <li>wypełnienia obowiązków podatkowo-księgowych (art. 6 ust. 1 lit. c RODO),</li>
            <li>obsługi reklamacji i ewentualnych roszczeń (art. 6 ust. 1 lit. f RODO),</li>
            <li>wysyłki newslettera — wyłącznie po wyrażeniu zgody (art. 6 ust. 1 lit. a RODO).</li>
          </ul>
          <p>Zakupy możesz zrobić jako gość — założenie konta nie jest wymagane.</p>
        </Section>

        <Section title="3. Konto klienta (opcjonalne)">
          <p>
            Możesz — ale nie musisz — założyć konto. Logowanie odbywa się bez hasła: na podany e-mail wysyłamy
            jednorazowy link. W ramach konta przetwarzamy: Twój adres e-mail, opcjonalnie imię, nazwisko i telefon,
            zapisane adresy dostawy oraz historię zamówień powiązaną z kontem. Podstawą jest wykonanie umowy i nasz
            uzasadniony interes w ułatwieniu kolejnych zakupów (art. 6 ust. 1 lit. b i f RODO), a w przypadku zgody
            marketingowej — Twoja zgoda (lit. a).
          </p>
          <p>
            Konto możesz usunąć w każdej chwili w panelu <strong>Moje konto → Dane konta → Usuń konto</strong>. Usuwamy
            wtedy profil i zapisane adresy; zamówienia pozostają w dokumentacji księgowej (wymóg prawa), ale przestają
            być powiązane z kontem.
          </p>
        </Section>

        <Section title="4. Odbiorcy danych i transfery poza EOG">
          <p>
            Dane przekazujemy wyłącznie podmiotom niezbędnym do realizacji usługi: operatorowi płatności (Stripe),
            firmie kurierskiej (InPost) oraz dostawcy hostingu, bazy danych i uwierzytelniania kont (Supabase). Podmioty
            te przetwarzają dane na nasze zlecenie. Nie sprzedajemy Twoich danych.
          </p>
          <p>
            Część dostawców (m.in. Stripe, Supabase) może przetwarzać dane również na serwerach poza Europejskim
            Obszarem Gospodarczym. W takim przypadku transfer odbywa się na podstawie standardowych klauzul umownych
            (SCC) zatwierdzonych przez Komisję Europejską lub decyzji o adekwatności, zapewniających odpowiedni poziom
            ochrony danych.
          </p>
        </Section>

        <Section title="5. Okres przechowywania">
          <p>
            Dane zamówień i dokumenty rozliczeniowe przechowujemy przez okres wymagany przepisami podatkowymi
            (co do zasady 5 lat licząc od końca roku, w którym wystawiono dokument). Dane przydatne do dochodzenia lub
            obrony roszczeń przechowujemy do czasu ich przedawnienia. Dane konta przechowujemy do czasu jego usunięcia
            przez Ciebie, a dane przetwarzane na podstawie zgody (np. newsletter) — do czasu jej wycofania.
          </p>
        </Section>

        <Section title="6. Twoje prawa">
          <p>
            Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia oraz
            wniesienia sprzeciwu. Zgodę (np. marketingową) możesz wycofać w każdej chwili (w panelu „Moje konto" lub
            pisząc do nas) — bez wpływu na zgodność z prawem przetwarzania sprzed wycofania. Możesz też złożyć skargę do
            Prezesa Urzędu Ochrony Danych Osobowych (UODO).
          </p>
          <p>
            Nie podejmujemy wobec Ciebie decyzji opierających się wyłącznie na zautomatyzowanym przetwarzaniu, w tym
            profilowaniu, które wywoływałyby skutki prawne lub w podobny sposób istotnie na Ciebie wpływały.
          </p>
        </Section>

        <Section title="7. Pliki cookies">
          <p>
            Sklep używa niezbędnych plików cookies oraz pamięci przeglądarki (localStorage) do działania koszyka,
            logowania do konta i podstawowych funkcji. Nie używamy cookies marketingowych bez Twojej zgody. Możesz
            zarządzać cookies w ustawieniach przeglądarki.
          </p>
        </Section>
      </div>
    </>
  );
}
