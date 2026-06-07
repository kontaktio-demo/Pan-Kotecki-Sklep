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

// Podsumowanie miesiąca — motywujące dane.
statsRouter.get("/monthly", async (_req, res) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const monthStart = new Date(y, m, 1);
  const lastMonthStart = new Date(y, m - 1, 1);
  const sixStart = new Date(y, m - 5, 1);

  const [{ data: orders }, { data: items }, { data: customers }] = await Promise.all([
    supabase
      .from("orders")
      .select("total_grosze, payment_status, created_at")
      .eq("payment_status", "paid")
      .gte("created_at", sixStart.toISOString())
      .limit(8000),
    supabase.from("order_items").select("name, qty, order:orders(payment_status, created_at)").limit(12000),
    supabase.from("customers").select("created_at").gte("created_at", monthStart.toISOString()).limit(8000),
  ]);

  const paid = orders ?? [];
  const inThis = (d: string) => new Date(d) >= monthStart;
  const inLast = (d: string) => {
    const t = new Date(d);
    return t >= lastMonthStart && t < monthStart;
  };

  const thisPaid = paid.filter((o) => inThis(o.created_at));
  const lastPaid = paid.filter((o) => inLast(o.created_at));
  const thisRevenue = thisPaid.reduce((s, o) => s + (o.total_grosze ?? 0), 0);
  const lastRevenue = lastPaid.reduce((s, o) => s + (o.total_grosze ?? 0), 0);
  const changePct = lastRevenue > 0 ? Math.round(((thisRevenue - lastRevenue) / lastRevenue) * 100) : thisRevenue > 0 ? 100 : 0;

  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daily: { date: string; grosze: number }[] = [];
  const dayIndex: Record<string, number> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    dayIndex[date] = daily.length;
    daily.push({ date, grosze: 0 });
  }
  for (const o of thisPaid) {
    const key = String(o.created_at).slice(0, 10);
    if (key in dayIndex) daily[dayIndex[key]].grosze += o.total_grosze ?? 0;
  }
  const bestDay = daily.reduce((a, b) => (b.grosze > a.grosze ? b : a), daily[0] ?? { date: "", grosze: 0 });

  const byMonth: { label: string; grosze: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(y, m - i, 1);
    const end = new Date(y, m - i + 1, 1);
    const rev = paid
      .filter((o) => {
        const t = new Date(o.created_at);
        return t >= start && t < end;
      })
      .reduce((s, o) => s + (o.total_grosze ?? 0), 0);
    byMonth.push({ label: start.toLocaleDateString("pl-PL", { month: "short" }), grosze: rev });
  }

  let itemsSold = 0;
  const topMap: Record<string, number> = {};
  for (const it of items ?? []) {
    const ord = (it as unknown as { order: { payment_status: string; created_at: string } | null }).order;
    if (!ord || ord.payment_status !== "paid" || !inThis(ord.created_at)) continue;
    itemsSold += it.qty;
    topMap[it.name] = (topMap[it.name] ?? 0) + it.qty;
  }
  const top = Object.entries(topMap).sort((a, b) => b[1] - a[1])[0];

  const beatLast = lastRevenue > 0 && thisRevenue < lastRevenue;
  const goalGrosze = beatLast ? lastRevenue : Math.max(100000, Math.ceil((thisRevenue + 1) / 100000) * 100000);
  const goalProgress = goalGrosze > 0 ? Math.min(100, Math.round((thisRevenue / goalGrosze) * 100)) : 0;

  res.json({
    monthLabel: now.toLocaleDateString("pl-PL", { month: "long", year: "numeric" }),
    thisRevenueGrosze: thisRevenue,
    lastRevenueGrosze: lastRevenue,
    changePct,
    ordersCount: thisPaid.length,
    itemsSold,
    newCustomers: (customers ?? []).length,
    avgOrderGrosze: thisPaid.length ? Math.round(thisRevenue / thisPaid.length) : 0,
    bestDay,
    topProduct: top ? { name: top[0], qty: top[1] } : null,
    daily,
    byMonth,
    goal: { goalGrosze, progress: goalProgress, beatLast },
  });
});
