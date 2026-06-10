// Akordeon na natywnych <details>/<summary> - zero JS, pełna dostępność.
export function AccordionItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-line py-1">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-base font-medium marker:hidden [&::-webkit-details-marker]:hidden">
        {question}
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-ash transition-transform duration-300 group-open:rotate-45 group-open:border-ink group-open:text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </summary>
      <div className="pb-5 pr-10 text-sm leading-relaxed text-ink-soft">{children}</div>
    </details>
  );
}

export function Accordion({ children }: { children: React.ReactNode }) {
  return <div className="border-t border-line">{children}</div>;
}
