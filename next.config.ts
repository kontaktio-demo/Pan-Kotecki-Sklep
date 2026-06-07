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
  // Nagłówki bezpieczeństwa dla całej strony. CSP celowo minimalne (tylko
  // base-uri + frame-ancestors), żeby nie wywrócić inline-skryptów Next/Turbopack;
  // pełną CSP można dodać po testach.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          { key: "Content-Security-Policy", value: "base-uri 'self'; frame-ancestors 'none'" },
        ],
      },
    ];
  },
};

export default nextConfig;
