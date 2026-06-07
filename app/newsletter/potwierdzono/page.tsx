import type { Metadata } from "next";
import Link from "next/link";
import Paw from "@/components/ui/Paw";

export const metadata: Metadata = {
  title: "Zapis potwierdzony",
  robots: { index: false },
};

export default async function NewsletterConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ kod?: string }>;
}) {
  const { kod } = await searchParams;

  return (
    <div className="relative overflow-hidden">
      <div className="paw-pattern pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="container-edge relative flex min-h-[64vh] flex-col items-center justify-center py-20 text-center md:py-28">
        <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-peach text-orange-deep shadow-sm">
          <Paw className="h-7 w-7" />
        </span>
        <h1 className="text-3xl font-semibold md:text-4xl">Zapisano! Dziękujemy 🐾</h1>

        {kod ? (
          <>
            <p className="mt-3 max-w-md text-ink-soft">Oto Twój kod na pierwsze zakupy:</p>
            <div className="mt-4 inline-block rounded-xl border-2 border-dashed border-orange px-8 py-3.5 text-2xl font-bold tracking-[0.18em] text-ink">
              {kod}
            </div>
            <p className="mt-3 text-sm text-ash">Wpisz go w koszyku przy podsumowaniu zamówienia.</p>
          </>
        ) : (
          <p className="mt-3 max-w-md text-ink-soft">
            Twój zapis jest już potwierdzony. Miło Cię mieć na pokładzie!
          </p>
        )}

        <Link
          href="/sklep"
          className="tap mt-8 rounded-xl bg-coral px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-coral/20 transition-colors hover:bg-coral-deep"
        >
          Przejdź do sklepu
        </Link>
      </div>
    </div>
  );
}
