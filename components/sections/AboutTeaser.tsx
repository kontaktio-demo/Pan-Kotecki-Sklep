import Image from "next/image";
import Link from "next/link";
import { ABOUT_PHOTOS } from "@/lib/photos";
import Reveal from "@/components/ui/Reveal";

export default function AboutTeaser() {
  return (
    <section className="container-edge pt-16 md:pt-24">
      <Reveal className="grid items-center gap-8 overflow-hidden rounded-2xl border border-line bg-white md:grid-cols-2">
        <div className="relative aspect-[4/3] md:aspect-auto md:h-full md:min-h-[22rem]">
          <Image
            src={ABOUT_PHOTOS[0].src}
            alt={ABOUT_PHOTOS[0].alt}
            fill
            sizes="(min-width: 768px) 44rem, 100vw"
            className="object-cover"
          />
        </div>
        <div className="p-8 md:p-12">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-ash">O marce</p>
          <h2 className="text-2xl font-semibold md:text-3xl">Sklep stworzony przez kociarzy</h2>
          <p className="mt-4 max-w-md leading-relaxed text-ink-soft">
            Wybieramy rzeczy, które sami daliśmy swoim kotom — proste, ładne i
            naprawdę używane. Bez przypadkowych gadżetów, które lądują w szufladzie.
          </p>
          <Link
            href="/o-nas"
            className="mt-7 inline-flex rounded-lg border border-ink/20 px-6 py-3 text-sm font-medium transition-colors hover:border-ink hover:bg-ink hover:text-milk"
          >
            Poznaj nas
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
