import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import CartView from "@/components/shop/CartView";

export const metadata: Metadata = {
  title: "Koszyk",
  description: "Twój koszyk w sklepie Pan Kotecki",
};

export default function KoszykPage() {
  return (
    <>
      <PageHeader eyebrow="Koszyk" title="Twoje zakupy" />
      <CartView />
    </>
  );
}
