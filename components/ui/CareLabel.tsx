// Sygnaturowy motyw marki - „metka" jak wszyta w ubranie, z przymrużeniem oka.
// Używaj OSZCZĘDNIE (sekcja o marce, karta produktu), nie wszędzie.

const SYMBOLS = [
  // balia (pranie)
  <path key="wash" d="M3 9h18l-1.5 9.5a2 2 0 0 1-2 1.7H6.5a2 2 0 0 1-2-1.7L3 9Zm3-3 1.5-2h9L18 6" />,
  // trójkąt (wybielanie)
  <path key="bleach" d="M12 4 21 20H3L12 4Z" />,
  // żelazko
  <path key="iron" d="M3 16c2-5 6-7 11-7l6 1-1 6H3Zm3 0v2m4-2v2m4-2v2" />,
];

export default function CareLabel({
  lines,
  className = "",
}: {
  lines: string[];
  className?: string;
}) {
  return (
    <div
      className={`relative inline-block max-w-xs rounded-md bg-milk px-5 pb-4 pt-5 text-ink shadow-[0_8px_24px_-16px_rgba(20,12,4,0.5)] ring-1 ring-line ${className}`}
    >
      {/* szew u góry */}
      <span className="absolute inset-x-4 top-2 border-t border-dashed border-mist/70" />
      <div className="mb-2.5 flex items-center gap-2 text-ash">
        {SYMBOLS.map((s, i) => (
          <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {s}
          </svg>
        ))}
        <span className="ml-1 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-mist">Instrukcja</span>
      </div>
      <ul className="space-y-1.5">
        {lines.map((l, i) => (
          <li key={i} className="flex gap-2 text-[0.78rem] leading-snug text-ink-soft">
            <span aria-hidden="true" className="select-none text-mist">-</span>
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}
