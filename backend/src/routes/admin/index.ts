import { Router } from "express";
import { requireAdmin, type AdminRequest } from "../../lib/auth.js";
import { productsRouter } from "./products.js";
import { categoriesRouter } from "./categories.js";
import { promotionsRouter } from "./promotions.js";
import { ordersRouter } from "./orders.js";
import { customersRouter } from "./customers.js";
import { statsRouter } from "./stats.js";
import { settingsRouter } from "./settings.js";

export const adminRouter = Router();

// Wszystko poniżej wymaga ważnego tokenu admina.
adminRouter.use(requireAdmin);

adminRouter.get("/me", (req: AdminRequest, res) => res.json({ admin: req.admin }));
adminRouter.use("/products", productsRouter);
adminRouter.use("/categories", categoriesRouter);
adminRouter.use("/promotions", promotionsRouter);
adminRouter.use("/orders", ordersRouter);
adminRouter.use("/customers", customersRouter);
adminRouter.use("/stats", statsRouter);
adminRouter.use("/settings", settingsRouter);
