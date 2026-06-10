import type { Metadata } from "next";
import WishlistPage from "@/components/shop/WishlistPage";

export const metadata: Metadata = {
  title: "Ulubione",
  description: "Twoje ulubione produkty w Pan Kotecki.",
  robots: { index: false },
};

export default function UlubionePage() {
  return <WishlistPage />;
}
