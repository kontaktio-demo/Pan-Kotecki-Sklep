import Image from "next/image";
import Link from "next/link";
import { BANNER_PHOTO } from "@/lib/photos";
import Paw from "@/components/ui/Paw";

export default function HeroBanner() {
  return (
    <section className="container-edge pt-6 md:pt-8">
      <div className="relative flex min-h-[60vh] items-center overflow-hidden rounded-[2rem] md:min-h-[68vh]">
        <Image
          src={BANNER_PHOTO.src}
          alt={BANNER_PHOTO.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover hero-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/45 to-transparent" />

        <div className="relative z-10 max-w-xl px-7 py-12 text-milk md:px-14">
          <p className="rise mb-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-milk/80">
            <Paw className="h-4 w-4 text-orange" />
            Od kociarzy dla kociarzy
          </p>
          <h1 className="rise text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl" style={{ animationDelay: "90ms" }}>
            Wszystko dla Twojego kota
          </h1>
          <p className="rise mt-5 max-w-md text-milk/85" style={{ animationDelay: "180ms" }}>
            Sami mamy koty i wiemy, co się sprawdza. Wybieramy tylko rzeczy, które
            naprawdę cieszą — kota i Ciebie.
          </p>
          <div className="rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "270ms" }}>
            <Link
              href="/sklep"
              className="rounded-lg bg-coral px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-coral-deep"
            >
              Przejdź do sklepu
            </Link>
            <Link
              href="/sklep?kategoria=zabawki"
              className="rounded-lg border border-white/40 px-7 py-3.5 text-sm font-medium text-milk backdrop-blur-sm transition-colors hover:bg-white hover:text-ink"
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
          <div className="border-l border-line pl-3 text-2xl font-semibold tabular-nums">4.9</div>
        </div>
      </div>
    </section>
  );
}
