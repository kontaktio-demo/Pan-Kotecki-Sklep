"use client";

import Link from "next/link";
import Paw from "@/components/ui/Paw";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="relative overflow-hidden">
      <div className="paw-pattern pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="container-edge relative flex min-h-[64vh] flex-col items-center justify-center py-24 text-center">
        <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-peach text-orange-deep shadow-sm">
          <Paw className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-semibold md:text-3xl">Coś poszło nie tak</h1>
        <p className="mt-3 max-w-md text-ink-soft">
          Kot chyba nadepnął na kabel. Spróbuj odświeżyć - zwykle to wystarcza.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="tap rounded-xl bg-coral px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-coral/20 hover:bg-coral-deep"
          >
            Spróbuj ponownie
          </button>
          <Link href="/" className="tap rounded-xl border border-ink/20 px-7 py-3.5 text-sm font-medium transition-colors hover:border-ink hover:bg-ink hover:text-milk">
            Strona główna
          </Link>
        </div>
      </div>
    </div>
  );
}
