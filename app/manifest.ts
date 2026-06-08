import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pan Kotecki - sklep dla kotów i ich ludzi",
    short_name: "Pan Kotecki",
    description: "Zabawki, akcesoria, kubki i gadżety dla kotów oraz ich właścicieli. Wysyłka 24h, darmowa dostawa od 149 zł.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f4ec",
    theme_color: "#f8f4ec",
    lang: "pl",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
