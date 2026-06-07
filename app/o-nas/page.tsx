import type { Metadata } from "next";
import Image from "next/image";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ABOUT_PHOTOS } from "@/lib/photos";

export const metadata: Metadata = {
  title: "O nas",
  description:
    "Pan Kotecki to sklep tworzony przez ludzi, którzy dzielą dom z kotami. Wybieramy rzeczy proste, ładne i naprawdę używane.",
};

const VALUES = [
  { n: "01", t: "Wybór, nie nadmiar", d: "Testujemy rzeczy na własnych kotach i zostawiamy tylko te, które się sprawdzają." },
  { n: "02", t: "Estetyka ma znaczenie", d: "Przedmioty dla kota nie muszą psuć wnętrza. Stawiamy na spokojne, ponadczasowe formy." },
  { n: "03", t: "Uczciwie i blisko", d: "Realne opisy, szybka wysyłka i kontakt z ludźmi, którzy znają temat." },
];

export default function ONasPage() {
  return (
    <>
      <PageHeader
        eyebrow="O nas"
        title="Sklep stworzony przez kociarzy"
        description="Pan Kotecki powstał z prostego przekonania: rzeczy dla kota mogą być przemyślane, estetyczne i naprawdę służyć — kotu i Tobie."
      />

      <section className="container-edge grid items-center gap-10 pb-4 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image
            src={ABOUT_PHOTOS[0].src}
            alt={ABOUT_PHOTOS[0].alt}
            fill
            sizes="(min-width: 1024px) 40rem, 100vw"
            className="object-cover"
          />
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-semibold md:text-3xl">Zaczęło się od własnych kotów</h2>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Mieliśmy dość wybierania spośród setek przypadkowych gadżetów, które
            lądowały w szufladzie po tygodniu. Postanowiliśmy zrobić sklep, w
            którym każda rzecz przeszła test codzienności — drapania, gonienia,
            spania i porannej kawy obok mruczącego towarzysza.
          </p>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Dziś Pan Kotecki to starannie dobrana lista rzeczy, za którymi stoimy.
            Bez kompromisów na jakości, bez wizualnego chaosu.
          </p>
        </div>
      </section>

      <section className="container-edge py-16 md:py-20">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {VALUES.map((v, i) => (
            <div key={v.n} className="flex flex-col gap-3 bg-milk p-8 md:p-10">
              <span className={`font-display text-2xl font-semibold ${i === 1 ? "text-teal" : "text-coral"}`}>{v.n}</span>
              <h3 className="text-xl font-semibold">{v.t}</h3>
              <p className="text-sm leading-relaxed text-ink-soft">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-edge grid items-center gap-10 pb-20 lg:grid-cols-[1fr_0.8fr] lg:gap-16">
        <div className="order-2 max-w-md lg:order-1">
          <h2 className="text-2xl font-semibold md:text-3xl">Dla kotów i ich ludzi</h2>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Wierzymy, że dobry przedmiot łączy dwie strony — wygodę kota i spokój
            właściciela. Tworzymy Pana Koteckiego tak, żeby zakupy były tu przyjemnością,
            a nie kolejnym przeglądaniem tysiąca podobnych rzeczy.
          </p>
          <div className="mt-7">
            <Button href="/sklep" arrow>
              Zobacz sklep
            </Button>
          </div>
        </div>
        <div className="relative order-1 aspect-[4/5] overflow-hidden rounded-2xl lg:order-2">
          <Image
            src={ABOUT_PHOTOS[1].src}
            alt={ABOUT_PHOTOS[1].alt}
            fill
            sizes="(min-width: 1024px) 32rem, 100vw"
            className="object-cover"
          />
        </div>
      </section>
    </>
  );
}
