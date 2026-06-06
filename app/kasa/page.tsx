import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import CheckoutForm from "@/components/shop/CheckoutForm";

export const metadata: Metadata = {
  title: "Kasa",
  description: "Sfinalizuj zamówienie w Pan Kotecki",
};

export default function KasaPage() {
  return (
    <>
      <PageHeader eyebrow="Zamówienie" title="Kasa" />
      <CheckoutForm />
    </>
  );
}
