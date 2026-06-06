import Link from "next/link";
import Logo from "./Logo";

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
];

export default function Footer() {
  return (
    <footer className="relative mt-24 bg-ink text-milk">
      <div className="container-edge grid gap-12 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:py-16">
        <div className="max-w-sm">
          <Logo className="text-milk" />
          <p className="mt-5 text-sm leading-relaxed text-milk/60">
            Starannie wybrane gadżety dla kotów i ich ludzi. Mniej przypadkowych
            rzeczy, więcej takich, które naprawdę cieszą — kota i Ciebie.
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

      <div className="container-edge flex flex-wrap items-center gap-2 border-t border-white/10 py-5">
        <span className="mr-2 text-xs text-milk/40">Bezpieczne płatności:</span>
        {["BLIK", "Visa", "Mastercard", "Przelewy24", "Apple Pay"].map((p) => (
          <span key={p} className="rounded-md border border-white/15 px-2.5 py-1 text-[0.72rem] text-milk/70">
            {p}
          </span>
        ))}
      </div>

      <div className="container-edge flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-milk/40 md:flex-row md:items-center md:justify-between">
        <span>© {new Date().getFullYear()} Pan Kotecki · pankotecki.pl — Wszystkie prawa zastrzeżone.</span>
        <span>Darmowa dostawa od 149 zł · Wysyłka 24h · 30 dni na zwrot</span>
      </div>
    </footer>
  );
}
