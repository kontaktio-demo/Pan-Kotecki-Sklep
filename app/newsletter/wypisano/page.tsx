import type { Metadata } from "next";
import Link from "next/link";
import Paw from "@/components/ui/Paw";

export const metadata: Metadata = {
  title: "Wypisano z newslettera",
  robots: { index: false },
};

export default function NewsletterUnsubscribedPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="paw-pattern pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="container-edge relative flex min-h-[64vh] flex-col items-center justify-center py-20 text-center md:py-28">
        <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cream text-ash shadow-sm">
          <Paw className="h-7 w-7" />
        </span>
        <h1 className="text-3xl font-semibold md:text-4xl">Wypisano z newslettera</h1>
        <p className="mt-3 max-w-md text-ink-soft">
          Nie będziemy już wysyłać Ci wiadomości. Szkoda, ale rozumiemy — zawsze możesz wrócić. 🐾
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/sklep"
            className="tap rounded-xl bg-ink px-7 py-3.5 text-sm font-semibold text-milk transition-colors hover:bg-coral"
          >
            Wróć do sklepu
          </Link>
        </div>
      </div>
    </div>
  );
}
