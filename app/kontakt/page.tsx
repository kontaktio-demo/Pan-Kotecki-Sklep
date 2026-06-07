import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import ContactForm from "@/components/sections/ContactForm";
import RevealPhone from "@/components/RevealPhone";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Napisz do nas - chętnie pomożemy w doborze rzeczy dla Twojego kota.",
};

export default function KontaktPage() {
  return (
    <>
      <PageHeader
        eyebrow="Kontakt"
        title="Porozmawiajmy"
        description="Masz pytanie o produkt, zamówienie albo własnego kota? Pisz śmiało."
      />

      <section className="container-edge grid gap-12 pb-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="flex flex-col gap-8">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-ash">E-mail</p>
            <a href="mailto:biuro@pankotecki.pl" className="text-2xl font-semibold transition-colors hover:text-coral">
              biuro@pankotecki.pl
            </a>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-ash">Telefon</p>
            <RevealPhone className="text-2xl font-semibold" />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-ash">Godziny</p>
            <p className="text-2xl font-semibold">pon.-pt. 9:00-17:00</p>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ash">
            Najszybciej odpowiemy mailem - zwykle tego samego dnia. 🐾
          </p>
        </div>

        <ContactForm />
      </section>
    </>
  );
}
