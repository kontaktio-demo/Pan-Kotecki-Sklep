import "dotenv/config";
import express from "express";
import cors from "cors";
import { catalogRouter } from "./routes/catalog.js";
import { checkoutRouter } from "./routes/checkout.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin/index.js";

const app = express();

const origins = (process.env.CLIENT_ORIGIN ?? "*").split(",").map((s) => s.trim());
app.use(cors({ origin: origins.includes("*") ? true : origins }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "pan-kotecki-backend" }));

// Publiczne (sklep)
app.use("/api", catalogRouter);
app.use("/api/checkout", checkoutRouter);

// Panel: logowanie publiczne, reszta za tokenem
app.use("/api/admin", authRouter);
app.use("/api/admin", adminRouter);

const port = Number(process.env.PORT ?? 10000);
app.listen(port, () => console.log(`[pan-kotecki] API słucha na :${port}`));
