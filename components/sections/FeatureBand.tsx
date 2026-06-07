import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { BrandMark } from "@/components/layout/Logo";

export default function FeatureBand() {
  return (
    <section className="container-edge pt-16 md:pt-24">
      <div className="relative overflow-hidden rounded-[2rem] bg-teal-deep text-milk">
        {/* subtelny kocianany wzór + delikatna poświata, nadaje głębi bez przepychu */}
        <div className="paw-pattern pointer-events-none absolute inset-0 opacity-[0.05]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange/15 blur-3xl" />

        <div className="relative grid items-center gap-10 px-7 py-14 md:grid-cols-[1.2fr_0.8fr] md:px-14 md:py-20">
          <Reveal>
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-peach">
              <span className="h-1.5 w-1.5 rounded-full bg-orange" />
              Pan Kotecki
            </p>
            <h2 className="text-3xl font-semibold leading-[1.08] tracking-tight md:text-5xl">
              Dom, w którym mieszka kot,{" "}
              <span className="italic text-orange">jest cieplejszy</span>.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-milk/70">
              Wybieramy rzeczy, które wnoszą do domu trochę ciepła i mruczenia -
              proste, ładne i zrobione z myślą o wspólnym życiu z kotem.
            </p>
            <Link
              href="/o-nas"
              className="tap mt-8 inline-flex rounded-xl bg-orange px-7 py-3.5 text-sm font-semibold text-ink shadow-lg shadow-black/20 transition-colors hover:bg-orange-deep"
            >
              Poznaj Pana Koteckiego
            </Link>
          </Reveal>

          <Reveal delay={90} className="justify-self-center md:justify-self-end">
            <div className="relative flex h-52 w-52 items-end justify-center overflow-hidden rounded-full bg-peach shadow-2xl ring-8 ring-white/5 md:h-64 md:w-64 lg:h-72 lg:w-72">
              <BrandMark className="h-[116%] w-[116%] translate-y-3 text-ink" />
              <span className="absolute right-3 top-5 text-2xl">🐾</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
