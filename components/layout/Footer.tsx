import Link from "next/link";
import Logo from "./Logo";
import Paw from "@/components/ui/Paw";

const COLS = [
  {
    title: "Sklep",
    links: [
      { href: "/sklep", label: "Wszystko" },
      { href: "/sklep?kategoria=zabawki", label: "Zabawki" },
      { href: "/sklep?kategoria=akcesoria", label: "Akcesoria" },
      { href: "/sklep?kategoria=kubki", label: "Kubki" },
      { href: "/sklep?kategoria=dla-wlasciciela", label: "Dla właściciela" },
    ],
  },
  {
    title: "Marka",
    links: [
      { href: "/o-nas", label: "O nas" },
      { href: "/kontakt", label: "Kontakt" },
    ],
  },
  {
    title: "Informacje",
    links: [
      { href: "/faq", label: "Najczęstsze pytania" },
      { href: "/regulamin", label: "Regulamin" },
      { href: "/zwroty", label: "Zwroty i reklamacje" },
      { href: "/polityka-prywatnosci", label: "Polityka prywatności" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-ink text-milk">
      <div className="paw-pattern pointer-events-none absolute inset-0 opacity-[0.04]" />

      <div className="container-edge relative grid gap-12 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:py-16">
        <div className="max-w-sm">
          <Logo className="text-milk" />
          <p className="mt-5 text-sm leading-relaxed text-milk/60">
            Sami jesteśmy kociarzami i wybieramy tylko to, co dajemy własnym
            kotom. Wiemy, czego potrzebuje kot (i jego człowiek) - bez
            przypadkowych gadżetów, za to z głową i sercem.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 text-sm text-milk/85">
            <Paw className="h-4 w-4 text-orange" />
            Od kociarzy dla kociarzy
          </p>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <p className="mb-5 text-xs uppercase tracking-[0.22em] text-milk/40">{col.title}</p>
            <ul className="flex flex-col gap-3">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-milk/75 transition-colors hover:text-coral"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="container-edge relative flex flex-wrap items-center gap-2 border-t border-white/10 py-5">
        <span className="mr-2 text-xs text-milk/40">Bezpieczne płatności:</span>
        {["BLIK", "Visa", "Mastercard", "Przelewy24", "Apple Pay"].map((p) => (
          <span key={p} className="rounded-md border border-white/15 px-2.5 py-1 text-[0.72rem] text-milk/70">
            {p}
          </span>
        ))}
      </div>

      <div className="container-edge relative flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-milk/40 md:flex-row md:items-center md:justify-between">
        <span>© {new Date().getFullYear()} Pan Kotecki - pankotecki.pl - Wszystkie prawa zastrzeżone.</span>
        <span>Darmowa dostawa od 149 zł - Wysyłka 24h - 14 dni na zwrot</span>
      </div>
    </footer>
  );
}
