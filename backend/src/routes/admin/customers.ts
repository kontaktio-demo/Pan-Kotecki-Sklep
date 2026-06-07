import { Router } from "express";
import { supabase } from "../../lib/supabase.js";
import { badId, serverError } from "../../lib/util.js";

export const customersRouter = Router();

customersRouter.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) return serverError(res, "customers.list", error);
  res.json(data ?? []);
});

customersRouter.get("/:id", async (req, res) => {
  if (badId(res, req.params.id)) return;
  const { data: customer, error } = await supabase.from("customers").select("*").eq("id", req.params.id).maybeSingle();
  if (error) return serverError(res, "customers.get", error);
  if (!customer) return res.status(404).json({ error: "Nie znaleziono" });
  const { data: orders } = await supabase
    .from("orders")
    .select("id, number, status, payment_status, total_grosze, created_at")
    .eq("customer_id", req.params.id)
    .order("created_at", { ascending: false });
  res.json({ ...customer, orders: orders ?? [] });
});
