import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import ContactForm from "@/components/sections/ContactForm";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Napisz do nas — chętnie pomożemy w doborze rzeczy dla Twojego kota.",
};

const INFO = [
  { label: "E-mail", value: "kontakt@pankotecki.pl" },
  { label: "Telefon", value: "+48 600 000 000" },
  { label: "Godziny", value: "pon.–pt. 9:00–17:00" },
];

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
          {INFO.map((i) => (
            <div key={i.label}>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-ash">{i.label}</p>
              <p className="text-2xl font-semibold">{i.value}</p>
            </div>
          ))}
          <p className="max-w-xs text-sm leading-relaxed text-ash">
            Formularz jest częścią wersji demonstracyjnej — obsługę wiadomości
            podłączymy razem z backendem sklepu.
          </p>
        </div>

        <ContactForm />
      </section>
    </>
  );
}
