const ITEMS = [
  {
    title: "Darmowa dostawa",
    sub: "dla zamówień od 149 zł",
    icon: (
      <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z M7 18a2 2 0 1 0 .1 0M18 18a2 2 0 1 0 .1 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Wysyłka 24h",
    sub: "zamówienia do 14:00",
    icon: <path d="M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Bezpieczne płatności",
    sub: "szyfrowane i pewne",
    icon: <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3ZM9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Łatwe zwroty",
    sub: "14 dni na zwrot",
    icon: <path d="M4 8h11a5 5 0 0 1 0 10H9M4 8l4-4M4 8l4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

import Reveal from "@/components/ui/Reveal";

// Naprzemienne kolory ikon — ciepły pomarańcz i chłodny teal (para komplementarna)
const ICON_TONES = [
  "bg-orange/12 text-orange-deep",
  "bg-teal/12 text-teal",
  "bg-orange/12 text-orange-deep",
  "bg-teal/12 text-teal",
];

export default function TrustBar() {
  return (
    <section className="container-edge pt-8 md:pt-12">
      <Reveal className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-white p-3 md:grid-cols-4 md:gap-4 md:p-5">
        {ITEMS.map((item, i) => (
          <div key={item.title} className="flex items-center gap-3 rounded-xl px-2 py-2 md:py-1">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ICON_TONES[i]}`}>
              <svg width="22" height="22" viewBox="0 0 24 24">{item.icon}</svg>
            </span>
            <span>
              <span className="block text-sm font-medium leading-tight">{item.title}</span>
              <span className="block text-xs leading-tight text-ash">{item.sub}</span>
            </span>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
