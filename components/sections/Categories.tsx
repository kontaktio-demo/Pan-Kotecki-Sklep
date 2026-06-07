import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/products";
import { CATEGORY_PHOTOS } from "@/lib/photos";
import Reveal from "@/components/ui/Reveal";
import Paw from "@/components/ui/Paw";

export default async function Categories() {
  const categories = await getCategories();

  return (
    <section className="container-edge pt-16 md:pt-24">
      <div className="rounded-[2rem] bg-peach px-6 py-12 md:px-12 md:py-16">
        <Reveal className="mb-7">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-orange-deep">
            <Paw className="h-3.5 w-3.5" />
            Kategorie
          </p>
          <h2 className="text-2xl font-semibold md:text-3xl">Czego dziś szuka Twój kot?</h2>
          <p className="mt-1.5 text-sm text-ink-soft/80">Cztery działy, jeden szef — a szefem jest kot.</p>
        </Reveal>

        <Reveal delay={70} className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {categories.map((cat) => {
          const photo = CATEGORY_PHOTOS[cat.slug];
          return (
            <Link
              key={cat.slug}
              href={`/sklep?kategoria=${cat.slug}`}
              className="tap group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl p-5 text-milk shadow-[0_16px_40px_-24px_rgba(20,12,4,0.55)] ring-1 ring-ink/5"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 768px) 22rem, 50vw"
                className="object-cover transition-transform duration-[650ms] ease-out group-hover:scale-[1.07]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent transition-opacity duration-500 group-hover:from-ink/90" />
              <div className="relative translate-y-1 transition-transform duration-300 group-hover:translate-y-0">
                <h3 className="text-lg font-semibold leading-tight">{cat.name}</h3>
                <span className="mt-1 inline-flex items-center gap-1.5 text-sm text-milk/85">
                  <span className="h-px w-5 bg-orange transition-all duration-300 group-hover:w-8" />
                  Zobacz
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>
          );
        })}
        </Reveal>
      </div>
    </section>
  );
}
