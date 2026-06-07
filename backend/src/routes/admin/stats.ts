import { Router } from "express";
import { supabase } from "../../lib/supabase.js";

export const statsRouter = Router();

statsRouter.get("/", async (_req, res) => {
  const [{ data: orders }, { count: productsCount }, { count: customersCount }, { data: items }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, number, email, status, payment_status, total_grosze, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("order_items").select("name, qty, price_grosze, order:orders(payment_status)").limit(5000),
  ]);

  const all = orders ?? [];
  const paid = all.filter((o) => o.payment_status === "paid");
  const revenueGrosze = paid.reduce((s, o) => s + (o.total_grosze ?? 0), 0);

  const byDay: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    byDay[d] = 0;
  }
  for (const o of paid) {
    const d = String(o.created_at).slice(0, 10);
    if (d in byDay) byDay[d] += o.total_grosze ?? 0;
  }

  const topMap: Record<string, { name: string; qty: number; revenueGrosze: number }> = {};
  for (const it of items ?? []) {
    const order = (it as unknown as { order: { payment_status: string } | null }).order;
    if (order?.payment_status !== "paid") continue;
    const cur = topMap[it.name] ?? { name: it.name, qty: 0, revenueGrosze: 0 };
    cur.qty += it.qty;
    cur.revenueGrosze += it.qty * it.price_grosze;
    topMap[it.name] = cur;
  }
  const topProducts = Object.values(topMap).sort((a, b) => b.qty - a.qty).slice(0, 8);

  res.json({
    revenueGrosze,
    ordersCount: all.length,
    paidCount: paid.length,
    pendingCount: all.filter((o) => o.status === "pending").length,
    shippedCount: all.filter((o) => o.status === "shipped" || o.status === "delivered").length,
    productsCount: productsCount ?? 0,
    customersCount: customersCount ?? 0,
    avgOrderGrosze: paid.length ? Math.round(revenueGrosze / paid.length) : 0,
    revenueByDay: Object.entries(byDay).map(([date, grosze]) => ({ date, grosze })),
    recentOrders: all.slice(0, 8),
    topProducts,
  });
});
