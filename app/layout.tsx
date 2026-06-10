import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/shop/CartDrawer";
import CatPeek from "@/components/shop/CatPeek";
import CookieConsent from "@/components/CookieConsent";
import { AuthProvider } from "@/components/account/AuthProvider";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import Toaster from "@/components/ui/Toaster";
import JsonLd from "@/components/seo/JsonLd";

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
    default: "Pan Kotecki - gadżety i zabawki dla kotów oraz ich ludzi",
    template: "%s - Pan Kotecki",
  },
  description:
    "Zabawki, akcesoria, kubki i gadżety dla kotów i ich właścicieli. Szybka wysyłka 24h, darmowa dostawa od 149 zł.",
  keywords: [
    "gadżety dla kotów", "zabawki dla kotów", "akcesoria dla kotów", "drapaki dla kota",
    "kubki dla kociary", "sklep dla kota", "prezent dla kociary", "Pan Kotecki",
  ],
  applicationName: "Pan Kotecki",
  authors: [{ name: "Pan Kotecki" }],
  creator: "Pan Kotecki",
  publisher: "Pan Kotecki",
  category: "shopping",
  formatDetection: { telephone: false, email: false, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: siteUrl,
    siteName: "Pan Kotecki",
    title: "Pan Kotecki - sklep dla kotów i ich ludzi",
    description:
      "Zabawki, akcesoria, kubki i gadżety dla kotów. Szybka wysyłka 24h, darmowa dostawa od 149 zł.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pan Kotecki - sklep dla kotów i ich ludzi",
    description: "Zabawki, akcesoria, kubki i gadżety dla kotów. Wysyłka 24h, darmowa dostawa od 149 zł.",
  },
  alternates: { canonical: "/" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION } }
    : {}),
};

const ORG_LD = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: "Pan Kotecki",
  url: siteUrl,
  logo: `${siteUrl}/icon.svg`,
  description: "Sklep z gadżetami, zabawkami i akcesoriami dla kotów oraz ich właścicieli.",
  email: "biuro@pankotecki.pl",
  areaServed: "PL",
};

const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Pan Kotecki",
  url: siteUrl,
  inLanguage: "pl-PL",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/sklep?szukaj={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
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
        <JsonLd data={[ORG_LD, WEBSITE_LD]} />
        <AuthProvider>
          <SettingsProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
            <CatPeek />
            <CookieConsent />
            <Toaster />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
