import type { Metadata } from "next";
import EmbeddedPayment from "@/components/shop/EmbeddedPayment";

export const metadata: Metadata = {
  title: "Płatność",
  robots: { index: false },
};

export default function PaymentPage() {
  return <EmbeddedPayment />;
}
