import "dotenv/config";
import "express-async-errors"; // przekazuje błędy z async-handlerów do error-handlera (Express 4)
import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { catalogRouter } from "./routes/catalog.js";
import { checkoutRouter } from "./routes/checkout.js";
import { accountRouter } from "./routes/account.js";
import { contactRouter } from "./routes/contact.js";
import { newsletterRouter } from "./routes/newsletter.js";
import { adminRouter } from "./routes/admin/index.js";
import { stripeWebhook } from "./routes/payments.js";

// Nie pozostawiaj wiszących odrzuconych promes bez logu.
process.on("unhandledRejection", (e) => console.error("[unhandledRejection]", e));

const isProd = process.env.NODE_ENV === "production";

// Ostrzeżenia konfiguracyjne - NIE crashujemy serwera (sklep na żywo musi działać),
// ale głośno logujemy braki, żeby misconfig był widoczny w logach Rendera.
const adminKey = process.env.ADMIN_API_KEY ?? "";
if (adminKey && adminKey.length < 32) {
  console.warn("[boot] ⚠️ ADMIN_API_KEY jest krótki (<32 znaki) - ustaw długi, losowy klucz.");
}
if (isProd) {
  if (!process.env.SITE_URL) console.warn("[boot] ⚠️ SITE_URL nie ustawiony - płatność Stripe niemożliwa (brak success_url).");
  if (!process.env.STRIPE_WEBHOOK_SECRET) console.warn("[boot] ⚠️ STRIPE_WEBHOOK_SECRET nie ustawiony - opłacone zamówienia NIE oznaczą się jako 'paid'.");
  if (!process.env.RESEND_API_KEY) console.warn("[boot] ⚠️ RESEND_API_KEY nie ustawiony - maile (potwierdzenia, newsletter) NIE będą wysyłane.");
  if (!process.env.HCAPTCHA_SECRET) console.warn("[boot] ⚠️ HCAPTCHA_SECRET nie ustawiony - captcha formularzy jest WYŁĄCZONA (fail-open).");
}

const app = express();

// Render działa za proxy - potrzebne do poprawnego IP w rate-limit.
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Nagłówki bezpieczeństwa. To API JSON, więc CSP wyłączone (nie serwuje HTML),
// ale HSTS/nosniff/no-frame/referrer-policy są jak najbardziej na miejscu.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false, // pozwól na pobranie etykiety PDF z innej domeny (panel)
    hsts: isProd ? { maxAge: 15552000, includeSubDomains: true } : false,
    referrerPolicy: { policy: "no-referrer" },
    frameguard: { action: "deny" },
  }),
);

// CORS: nasze API jest STATELESS i autoryzowane TOKENEM (Bearer dla kont /
// x-admin-key dla paneli), BEZ ciasteczek. W takim modelu CORS nie jest granicą
// bezpieczeństwa - obca strona i tak nie zdobędzie tokenu ofiary, a publiczne
// trasy (katalog/checkout) są jawne. Dlatego dopuszczamy każdy origin, żeby sklep
// i oba panele (mobilny, desktop) działały niezależnie od hostingu. Nadużycia
// ogranicza rate-limit. (CLIENT_ORIGIN nie jest już potrzebny.)
app.use(cors({ origin: true }));
app.use(compression());

// Webhook Stripe: surowe body (weryfikacja podpisu) + własny limit (publiczny, robi kryptografię).
app.use("/api/payments/webhook", rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }));
app.post("/api/payments/webhook", express.raw({ type: "*/*" }), stripeWebhook);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "pan-kotecki-backend" }));

// Limity (ochrona przed nadużyciem / brute-force klucza / spamem zamówień)
app.use("/api", rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.use("/api/checkout", rateLimit({ windowMs: 15 * 60_000, max: 30, standardHeaders: true, legacyHeaders: false }));
app.use("/api/order-status", rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false }));
app.use("/api/account", rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }));
app.use("/api/contact", rateLimit({ windowMs: 60 * 60_000, max: 10, standardHeaders: true, legacyHeaders: false }));
app.use("/api/newsletter", rateLimit({ windowMs: 60 * 60_000, max: 20, standardHeaders: true, legacyHeaders: false }));
app.use("/api/admin", rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false }));

// Publiczne (sklep)
app.use("/api", catalogRouter);
app.use("/api/checkout", checkoutRouter);

// Konta klientów (chronione tokenem Supabase - weryfikacja w routerze)
app.use("/api/account", accountRouter);

// Formularze publiczne (zapisywane do bazy - nic nie ginie)
app.use("/api/contact", contactRouter);
app.use("/api/newsletter", newsletterRouter);

// Panel (chronione kluczem ADMIN_API_KEY)
app.use("/api/admin", adminRouter);

// 404 dla nieznanych tras /api - spójna, nieujawniająca odpowiedź JSON.
app.use("/api", (_req, res) => res.status(404).json({ error: "Nie znaleziono" }));

// Globalny handler błędów - nigdy nie wycieka stack trace do klienta.
const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === "LIMIT_FILE_SIZE" ? "Plik za duży (max 12 MB)" : "Błąd przesyłania pliku";
    return res.status(413).json({ error: msg });
  }
  if (err?.type === "entity.parse.failed" || err?.type === "entity.too.large") {
    return res.status(400).json({ error: "Błędne dane" });
  }
  console.error("[unhandled]", err);
  res.status(500).json({ error: "Błąd serwera. Spróbuj ponownie." });
};
app.use(onError);

const port = Number(process.env.PORT ?? 10000);
app.listen(port, () => console.log(`[pan-kotecki] API słucha na :${port}`));
