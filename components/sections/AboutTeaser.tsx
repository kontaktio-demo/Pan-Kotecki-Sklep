import Image from "next/image";
import Link from "next/link";
import { ABOUT_PHOTOS } from "@/lib/photos";
import Reveal from "@/components/ui/Reveal";
import CareLabel from "@/components/ui/CareLabel";

export default function AboutTeaser() {
  return (
    <section className="container-edge pt-16 md:pt-24">
      <Reveal className="grid items-center gap-8 overflow-hidden rounded-[2rem] border border-line bg-white md:grid-cols-2">
        <div className="relative aspect-[4/3] md:aspect-auto md:h-full md:min-h-[24rem]">
          <Image
            src={ABOUT_PHOTOS[0].src}
            alt={ABOUT_PHOTOS[0].alt}
            fill
            sizes="(min-width: 768px) 44rem, 100vw"
            className="object-cover"
          />
          {/* dyskretna „metka" jako sygnatura marki */}
          <CareLabel
            className="absolute bottom-4 left-4 hidden sm:block"
            lines={[
              "Wybrane ręcznie, zatwierdzone łapą",
              "Testowane na własnych kotach",
              "Sierść gratis - to nasz znak firmowy",
            ]}
          />
        </div>
        <div className="p-8 md:p-12">
          <p className="eyebrow mb-3 inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            O marce
          </p>
          <h2 className="text-2xl font-semibold md:text-[2rem]">
            Sklep stworzony przez <span className="italic text-teal">kociarzy</span>
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-ink-soft">
            Wybieramy rzeczy, które sami daliśmy swoim kotom - proste, ładne i
            naprawdę używane. Bez przypadkowych gadżetów, które lądują w szufladzie.
          </p>
          <Link
            href="/o-nas"
            className="tap mt-7 inline-flex rounded-xl border border-ink/20 px-6 py-3 text-sm font-medium transition-colors hover:border-ink hover:bg-ink hover:text-milk"
          >
            Poznaj nas
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
