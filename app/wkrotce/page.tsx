import type { Metadata } from "next";
import Link from "next/link";
import Paw from "@/components/ui/Paw";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Sklep otwieramy wkrótce",
  description: "Sklep Pan Kotecki szykuje się do startu — już niedługo ruszamy!",
  robots: { index: false },
};

export default function WkrotcePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="paw-pattern pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="container-edge relative flex flex-col items-center py-24 text-center md:py-32">
        <span className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange to-coral text-4xl shadow-lg shadow-orange/30">
          🐾
        </span>
        <p className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-orange-deep">
          <Paw className="h-4 w-4" />
          Już niedługo
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          Sklep otwieramy <span className="text-coral">wkrótce</span>
        </h1>
        <p className="mt-5 max-w-md text-lg text-ink-soft">
          Dopinamy ostatnie kocie detale 🐈 Zaglądaj — niedługo ruszamy z pełnym sklepem dla Twojego kota (i Ciebie).
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button href="/" arrow>
            Strona główna
          </Button>
          <Button href="/o-nas" variant="outline">
            Poznaj nas
          </Button>
        </div>

        <p className="mt-10 text-sm text-ash">
          Masz pytanie?{" "}
          <a href="mailto:biuro@pankotecki.pl" className="text-orange-deep underline">
            biuro@pankotecki.pl
          </a>
        </p>
      </div>
    </div>
  );
}
