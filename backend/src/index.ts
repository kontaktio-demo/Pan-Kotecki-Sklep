import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { catalogRouter } from "./routes/catalog.js";
import { checkoutRouter } from "./routes/checkout.js";
import { adminRouter } from "./routes/admin/index.js";
import { stripeWebhook } from "./routes/payments.js";

const app = express();

// Render działa za proxy — potrzebne do poprawnego IP w rate-limit.
app.set("trust proxy", 1);
app.disable("x-powered-by");

// CORS: gdy CLIENT_ORIGIN = "*" (domyślnie) odbijamy każdy origin. Przy jawnej liście
// dopuszczamy też żądania bez origin / origin "null" (panel Electron z file://, curl).
const allow = (process.env.CLIENT_ORIGIN ?? "*").split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: allow.includes("*")
      ? true
      : (origin, cb) => cb(null, !origin || origin === "null" || allow.includes(origin)),
  }),
);
app.use(compression());

// Webhook Stripe MUSI dostać surowe body (weryfikacja podpisu) — montujemy przed express.json.
app.post("/api/payments/webhook", express.raw({ type: "*/*" }), stripeWebhook);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "pan-kotecki-backend" }));

// Limity (ochrona przed nadużyciem / brute-force klucza / spamem zamówień)
app.use("/api", rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.use("/api/checkout", rateLimit({ windowMs: 15 * 60_000, max: 30, standardHeaders: true, legacyHeaders: false }));
app.use("/api/admin", rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false }));

// Publiczne (sklep)
app.use("/api", catalogRouter);
app.use("/api/checkout", checkoutRouter);

// Panel (chronione kluczem ADMIN_API_KEY)
app.use("/api/admin", adminRouter);

// Globalny handler błędów — nigdy nie wycieka stack trace do klienta.
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
