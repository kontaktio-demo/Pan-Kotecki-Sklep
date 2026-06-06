import Image from "next/image";
import Link from "next/link";
import { BANNER_PHOTO } from "@/lib/photos";

export default function HeroBanner() {
  return (
    <section className="container-edge pt-6 md:pt-8">
      <div className="relative flex min-h-[64vh] items-center overflow-hidden rounded-2xl md:min-h-[70vh]">
        <Image
          src={BANNER_PHOTO.src}
          alt={BANNER_PHOTO.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover hero-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/45 to-transparent" />

        <div className="relative max-w-xl px-7 py-12 text-milk md:px-14">
          <p className="rise mb-4 text-xs font-medium uppercase tracking-[0.2em] text-milk/80">
            Sklep dla kotów i ich ludzi
          </p>
          <h1 className="rise text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl" style={{ animationDelay: "90ms" }}>
            Wszystko dla Twojego kota
          </h1>
          <p className="rise mt-5 max-w-md text-milk/85" style={{ animationDelay: "180ms" }}>
            Zabawki, akcesoria, kubki i drobiazgi — starannie wybrane, gotowe do
            wysyłki w 24 godziny.
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
      </div>
    </section>
  );
}
