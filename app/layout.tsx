import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/shop/CartDrawer";
import CatPeek from "@/components/shop/CatPeek";
import CookieConsent from "@/components/CookieConsent";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-logo",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pankotecki.pl";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pan Kotecki — gadżety i zabawki dla kotów oraz ich ludzi",
    template: "%s — Pan Kotecki",
  },
  description:
    "Zabawki, akcesoria, kubki i gadżety dla kotów i ich właścicieli. Szybka wysyłka 24h, darmowa dostawa od 149 zł.",
  keywords: ["gadżety dla kotów", "zabawki dla kotów", "akcesoria dla kotów", "kubki", "sklep dla kota", "Pan Kotecki"],
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: siteUrl,
    siteName: "Pan Kotecki",
    title: "Pan Kotecki — sklep dla kotów i ich ludzi",
    description:
      "Zabawki, akcesoria, kubki i gadżety dla kotów. Szybka wysyłka 24h, darmowa dostawa od 149 zł.",
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#f6f6f4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" className={`h-full ${inter.variable} ${fraunces.variable}`}>
      <body className="flex min-h-full flex-col bg-milk text-ink">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <CatPeek />
        <CookieConsent />
      </body>
    </html>
  );
}
