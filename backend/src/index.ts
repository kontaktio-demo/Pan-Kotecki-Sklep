import "dotenv/config";
import express from "express";
import cors from "cors";
import { catalogRouter } from "./routes/catalog.js";

const app = express();

const origins = (process.env.CLIENT_ORIGIN ?? "*").split(",").map((s) => s.trim());
app.use(cors({ origin: origins.includes("*") ? true : origins }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, service: "pan-kotecki-backend" }));

app.use("/api", catalogRouter);

const port = Number(process.env.PORT ?? 10000);
app.listen(port, () => console.log(`[pan-kotecki] API słucha na :${port}`));
