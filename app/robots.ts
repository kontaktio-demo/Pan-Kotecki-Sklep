import type { MetadataRoute } from "next";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pankotecki.pl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // prywatne / transakcyjne trasy poza indeksem
      disallow: ["/konto", "/kasa", "/koszyk", "/logowanie", "/newsletter/", "/api/"],
    },
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
