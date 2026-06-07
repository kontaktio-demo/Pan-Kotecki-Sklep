import type { NextConfig } from "next";

// Host Supabase bierzemy ze zmiennej (jeśli ustawiona) — zawężamy do własnego
// projektu i publicznego bucketu. Bez zmiennej fallback na subdomeny supabase.co.
const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    // serwujemy AVIF (z fallbackiem WebP) i responsywne rozmiary
    formats: ["image/avif", "image/webp"],
    // zdjęcia produktów z Supabase Storage (publiczny bucket)
    remotePatterns: [
      supabaseHost
        ? { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }
        : { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
    // nie podążaj za przekierowaniami przy optymalizacji (zamyka SSRF przez redirect)
    maximumRedirects: 0,
    // długi cache zoptymalizowanych obrazów
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
