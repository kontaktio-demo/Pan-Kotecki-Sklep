import Image from "next/image";
import Link from "next/link";
import { BANNER_PHOTO } from "@/lib/photos";
import Paw from "@/components/ui/Paw";

export default function HeroBanner() {
  return (
    <section className="container-edge pt-4 md:pt-8">
      <div className="relative flex min-h-[78vh] items-end overflow-hidden rounded-[1.75rem] md:min-h-[68vh] md:items-center md:rounded-[2rem]">
        <Image
          src={BANNER_PHOTO.src}
          alt={BANNER_PHOTO.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover hero-zoom"
        />
        {/* na mobile gradient od dołu (czytelność), na desktopie z lewej */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-ink/10 md:bg-gradient-to-r md:from-ink/85 md:via-ink/45 md:to-transparent" />

        <div className="relative z-10 w-full max-w-xl px-6 pb-9 pt-12 text-milk md:px-14 md:py-12">
          <p className="rise mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-milk/90 backdrop-blur-sm">
            <Paw className="h-3.5 w-3.5 text-orange" />
            Od kociarzy dla kociarzy
          </p>
          <h1
            className="rise text-[2.6rem] font-semibold leading-[1.02] tracking-tight md:text-6xl"
            style={{ animationDelay: "90ms" }}
          >
            Wszystko dla kota -{" "}
            <span className="italic text-peach">i dla jego człowieka.</span>
          </h1>
          <p className="rise mt-5 max-w-md text-[0.98rem] leading-relaxed text-milk/85 md:text-base" style={{ animationDelay: "180ms" }}>
            Zabawki, drapaki, kubki i kocie drobiazgi. Wybrane przez nas, zatwierdzone przez koty -
            a one, jak wiadomo, nie dają nic za darmo.
          </p>
          <div className="rise mt-7 flex flex-wrap gap-2.5 md:mt-8 md:gap-3" style={{ animationDelay: "270ms" }}>
            <Link
              href="/sklep"
              className="tap rounded-xl bg-coral px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-coral/25 transition-colors hover:bg-coral-deep"
            >
              Przejdź do sklepu
            </Link>
            <Link
              href="/sklep?kategoria=zabawki"
              className="tap rounded-xl border border-white/40 px-6 py-3.5 text-sm font-medium text-milk backdrop-blur-sm transition-colors hover:bg-white hover:text-ink"
            >
              Zabawki dla kota
            </Link>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 hidden items-center gap-3 rounded-2xl bg-milk/95 px-5 py-3 shadow-xl backdrop-blur lg:flex">
          <div>
            <div className="text-sm tracking-wide text-coral">★★★★★</div>
            <div className="text-xs text-ash">Pokochały nas tysiące kotów</div>
          </div>
          <div className="border-l border-line pl-3 text-2xl font-semibold tabular-nums">4,9</div>
        </div>
      </div>
    </section>
  );
}
