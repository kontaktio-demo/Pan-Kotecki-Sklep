import { Router } from "express";
import { supabase } from "../../lib/supabase.js";
import { serverError } from "../../lib/util.js";

// Statystyki liczone w SQL (RPC admin_sales_stats / admin_revenue_by_month) -
// skalują się do milionów zamówień zamiast agregować w JS na ograniczonych pulach.
export const statsRouter = Router();

type SalesStats = {
  revenue_grosze: number;
  orders_total: number;
  orders_paid: number;
  orders_pending: number;
  orders_shipped: number;
  avg_order_grosze: number;
  items_sold: number;
  daily: { d: string; revenue_grosze: number | null; orders: number }[];
  top_products: { slug: string; name: string; qty: number; revenue_grosze: number }[];
  by_category: { slug: string; name: string; qty: number; revenue_grosze: number }[];
};

async function salesStats(from: Date, to: Date): Promise<SalesStats | null> {
  const { data, error } = await supabase.rpc("admin_sales_stats", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) {
    console.error("[stats.rpc]", error);
    return null;
  }
  return data as SalesStats;
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

statsRouter.get("/", async (_req, res) => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  const epoch = new Date(0);
  const days30 = new Date(now.getTime() - 29 * 86400000);

  const [all, last30, products, customers, recent, lowStock, pendingReviews] = await Promise.all([
    salesStats(epoch, tomorrow),
    salesStats(days30, tomorrow),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id, number, email, status, payment_status, total_grosze, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .not("stock_qty", "is", null)
      .gt("stock_qty", 0)
      .lte("stock_qty", 5),
    supabase.from("product_reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  if (!all || !last30) return serverError(res, "stats", "rpc failed (uruchom upgrade_next_level.sql)");

  // pełne 30 dni (wykres bez dziur)
  const byDay: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) byDay[dayKey(new Date(now.getTime() - i * 86400000))] = 0;
  for (const d of last30.daily) {
    if (d.d in byDay) byDay[d.d] = Number(d.revenue_grosze ?? 0);
  }

  res.json({
    revenueGrosze: Number(all.revenue_grosze),
    ordersCount: all.orders_total,
    paidCount: all.orders_paid,
    pendingCount: all.orders_pending,
    shippedCount: all.orders_shipped,
    productsCount: products.count ?? 0,
    customersCount: customers.count ?? 0,
    avgOrderGrosze: Number(all.avg_order_grosze),
    revenueByDay: Object.entries(byDay).map(([date, grosze]) => ({ date, grosze })),
    recentOrders: recent.data ?? [],
    topProducts: all.top_products.slice(0, 8).map((t) => ({ name: t.name, qty: t.qty, revenueGrosze: Number(t.revenue_grosze) })),
    // nowe pola (panele mogą, ale nie muszą ich używać)
    byCategory: all.by_category.map((c) => ({ slug: c.slug, name: c.name, qty: c.qty, revenueGrosze: Number(c.revenue_grosze) })),
    lowStockCount: lowStock.count ?? 0,
    pendingReviewsCount: pendingReviews.count ?? 0,
  });
});

// Podsumowanie miesiąca - motywujące dane.
statsRouter.get("/monthly", async (_req, res) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const monthStart = new Date(y, m, 1);
  const lastMonthStart = new Date(y, m - 1, 1);
  const tomorrow = new Date(now.getTime() + 86400000);

  const [thisMonth, lastMonth, byMonthRpc, customers] = await Promise.all([
    salesStats(monthStart, tomorrow),
    salesStats(lastMonthStart, monthStart),
    supabase.rpc("admin_revenue_by_month", { p_months: 6 }),
    supabase.from("customers").select("*", { count: "exact", head: true }).gte("created_at", monthStart.toISOString()),
  ]);
  if (!thisMonth || !lastMonth) return serverError(res, "stats.monthly", "rpc failed (uruchom upgrade_next_level.sql)");

  const thisRevenue = Number(thisMonth.revenue_grosze);
  const lastRevenue = Number(lastMonth.revenue_grosze);
  const changePct = lastRevenue > 0 ? Math.round(((thisRevenue - lastRevenue) / lastRevenue) * 100) : thisRevenue > 0 ? 100 : 0;

  // pełny miesiąc dzień po dniu (wykres bez dziur)
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daily: { date: string; grosze: number }[] = [];
  const dayIndex: Record<string, number> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    dayIndex[date] = daily.length;
    daily.push({ date, grosze: 0 });
  }
  for (const d of thisMonth.daily) {
    if (d.d in dayIndex) daily[dayIndex[d.d]].grosze = Number(d.revenue_grosze ?? 0);
  }
  const bestDay = daily.reduce((a, b) => (b.grosze > a.grosze ? b : a), daily[0] ?? { date: "", grosze: 0 });

  // 6 miesięcy wstecz - uzupełnij brakujące miesiące zerami
  const rpcMonths = ((byMonthRpc.data ?? []) as { month: string; revenue_grosze: number }[]).reduce<Record<string, number>>(
    (acc, r) => ((acc[r.month] = Number(r.revenue_grosze)), acc),
    {},
  );
  const byMonth: { label: string; grosze: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(y, m - i, 1);
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    byMonth.push({ label: start.toLocaleDateString("pl-PL", { month: "short" }), grosze: rpcMonths[key] ?? 0 });
  }

  const top = thisMonth.top_products[0];
  const beatLast = lastRevenue > 0 && thisRevenue < lastRevenue;
  const goalGrosze = beatLast ? lastRevenue : Math.max(100000, Math.ceil((thisRevenue + 1) / 100000) * 100000);
  const goalProgress = goalGrosze > 0 ? Math.min(100, Math.round((thisRevenue / goalGrosze) * 100)) : 0;

  res.json({
    monthLabel: now.toLocaleDateString("pl-PL", { month: "long", year: "numeric" }),
    thisRevenueGrosze: thisRevenue,
    lastRevenueGrosze: lastRevenue,
    changePct,
    ordersCount: thisMonth.orders_paid,
    itemsSold: thisMonth.items_sold,
    newCustomers: customers.count ?? 0,
    avgOrderGrosze: Number(thisMonth.avg_order_grosze),
    bestDay,
    topProduct: top ? { name: top.name, qty: top.qty } : null,
    daily,
    byMonth,
    goal: { goalGrosze, progress: goalProgress, beatLast },
  });
});
