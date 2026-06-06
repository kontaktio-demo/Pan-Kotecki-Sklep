import type { Metadata } from "next";
import OrderConfirmation from "@/components/shop/OrderConfirmation";

export const metadata: Metadata = {
  title: "Dziękujemy za zamówienie",
  robots: { index: false },
};

export default function ThankYouPage() {
  return <OrderConfirmation />;
}
