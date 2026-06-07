import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import RevealPhone from "@/components/RevealPhone";

export const metadata: Metadata = {
  title: "Regulamin",
  description: "Regulamin sklepu internetowego Pan Kotecki.",
};

// Dane sprzedawcy (podmiot prawny). Marka handlowa to „Pan Kotecki".
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

export default function RegulaminPage() {
  return (
    <>
      <PageHeader eyebrow="Informacje" title="Regulamin sklepu" />
      <div className="container-edge max-w-3xl pb-24">
        <p className="text-sm text-ash">Ostatnia aktualizacja: czerwiec 2026.</p>

        <Section title="§1. Postanowienia ogólne">
          <p>
            Sklep internetowy „Pan Kotecki” działający pod adresem kotecki.pl prowadzony jest przez{" "}
            {SELLER.name}, {SELLER.address}, NIP: {SELLER.nip}, REGON: {SELLER.regon} (dalej „Sprzedawca”). Kontakt:{" "}
            {SELLER.email}, tel.: <RevealPhone className="font-medium text-ink" />.
          </p>
          <p>
            Regulamin określa zasady zawierania umów sprzedaży za pośrednictwem sklepu oraz prawa i obowiązki
            Sprzedawcy i Klienta.
          </p>
        </Section>

        <Section title="§2. Definicje">
          <p>
            <strong>Klient</strong> - osoba fizyczna, prawna lub jednostka organizacyjna składająca zamówienie.
            <br />
            <strong>Konsument</strong> - Klient będący osobą fizyczną, dokonujący zakupu w celach niezwiązanych z
            działalnością gospodarczą.
            <br />
            <strong>Produkt</strong> - towar dostępny w sklepie.
          </p>
        </Section>

        <Section title="§3. Składanie zamówień">
          <p>
            Zamówienia można składać 24/7 przez stronę sklepu. Złożenie zamówienia następuje po dodaniu produktów do
            koszyka, podaniu danych do dostawy oraz potwierdzeniu zakupu przyciskiem „Zamawiam i płacę”.
          </p>
          <p>
            Umowa sprzedaży zostaje zawarta z chwilą potwierdzenia przyjęcia zamówienia przez Sprzedawcę (e-mail
            potwierdzający). Ceny w sklepie podane są w złotych polskich i zawierają podatek VAT.
          </p>
          <p>
            Zakupy można złożyć jako gość albo po założeniu bezpłatnego, opcjonalnego konta. Logowanie do konta odbywa
            się bez hasła - na podany e-mail wysyłamy jednorazowy link. W koncie Klient ma dostęp do historii zamówień i
            zapisanych adresów dostawy i może je samodzielnie usunąć w dowolnym momencie.
          </p>
        </Section>

        <Section title="§4. Płatności">
          <p>
            Dostępne metody płatności: karta płatnicza, BLIK oraz Przelewy24 - obsługiwane bezpiecznie przez operatora
            Stripe. Realizacja zamówienia rozpoczyna się po zaksięgowaniu płatności.
          </p>
        </Section>

        <Section title="§5. Dostawa">
          <p>
            Dostawa realizowana jest za pośrednictwem InPost (paczkomaty oraz kurier) lub poprzez odbiór osobisty.
            Koszt i czas dostawy prezentowane są w trakcie składania zamówienia. Darmowa dostawa przysługuje od progu
            kwotowego wskazanego w koszyku.
          </p>
        </Section>

        <Section title="§6. Prawo odstąpienia od umowy">
          <p>
            Konsument może odstąpić od umowy bez podania przyczyny w terminie <strong>14 dni</strong> od otrzymania
            produktu, składając oświadczenie (np. e-mailem na {SELLER.email} lub przy użyciu wzoru formularza
            dostępnego na stronie „Zwroty i reklamacje"). Sprzedawca zwraca wszystkie otrzymane płatności w terminie
            14 dni, tą samą metodą płatności.
          </p>
          <p>
            Bezpośredni koszt odesłania produktu ponosi Konsument. Konsument odpowiada za zmniejszenie wartości rzeczy
            będące wynikiem korzystania z niej w sposób wykraczający poza konieczny do stwierdzenia charakteru, cech i
            funkcjonowania rzeczy. Prawo odstąpienia nie przysługuje m.in. dla produktów wykonanych na indywidualne
            zamówienie oraz dla towarów w zapieczętowanym opakowaniu, których po otwarciu nie można zwrócić ze względów
            higienicznych - oraz w innych przypadkach wskazanych w art. 38 ustawy o prawach konsumenta.
          </p>
        </Section>

        <Section title="§7. Reklamacje - brak zgodności towaru z umową">
          <p>
            Sprzedawca odpowiada wobec Konsumenta za brak zgodności towaru z umową na zasadach określonych w rozdziale
            5a ustawy o prawach konsumenta. Odpowiedzialność obejmuje brak zgodności istniejący w chwili dostarczenia
            towaru i ujawniony w ciągu <strong>2 lat</strong> od tego momentu.
          </p>
          <p>
            Reklamację można złożyć e-mailem na {SELLER.email}, opisując problem i dołączając zdjęcia. W pierwszej
            kolejności Konsument może żądać naprawy lub wymiany; gdy jest to niemożliwe lub wiązałoby się z nadmiernymi
            kosztami - obniżenia ceny albo odstąpienia od umowy. Reklamację rozpatrujemy w terminie <strong>14 dni</strong>.
          </p>
        </Section>

        <Section title="§8. Dane osobowe">
          <p>
            Administratorem danych osobowych jest Sprzedawca. Dane przetwarzane są w celu realizacji zamówień. Szczegóły
            znajdują się w <a href="/polityka-prywatnosci" className="text-orange-deep underline">Polityce prywatności</a>.
          </p>
        </Section>

        <Section title="§9. Konto i usługi świadczone drogą elektroniczną">
          <p>
            Sprzedawca świadczy drogą elektroniczną usługi: prowadzenie Konta, obsługę koszyka i składania zamówień
            oraz - za zgodą - newsletter. Założenie Konta jest bezpłatne i dobrowolne; logowanie odbywa się bez hasła
            (jednorazowy link wysyłany na e-mail). Umowa o prowadzenie Konta zawierana jest na czas nieoznaczony i może
            zostać rozwiązana przez Klienta w każdej chwili poprzez usunięcie Konta („Moje konto → Dane konta → Usuń
            konto").
          </p>
          <p>
            Do korzystania ze sklepu wystarczy urządzenie z aktualną przeglądarką, dostępem do internetu i aktywnym
            kontem e-mail. Zakazane jest dostarczanie treści o charakterze bezprawnym. Reklamacje dotyczące usług
            świadczonych drogą elektroniczną można składać na {SELLER.email} - rozpatrujemy je w terminie 14 dni.
          </p>
        </Section>

        <Section title="§10. Postanowienia końcowe">
          <p>
            W sprawach nieuregulowanych stosuje się przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz
            ustawy o prawach konsumenta. Konsument może skorzystać z pozasądowych sposobów rozpatrywania reklamacji,
            w tym platformy ODR: ec.europa.eu/consumers/odr.
          </p>
        </Section>
      </div>
    </>
  );
}
