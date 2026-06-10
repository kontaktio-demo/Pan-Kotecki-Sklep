import { Router } from "express";
import { supabase } from "../../lib/supabase.js";
import { badId, serverError } from "../../lib/util.js";
import { sendCsv } from "../../lib/csv.js";

export const customersRouter = Router();

function safeQ(input: string): string {
  return input.replace(/[^\p{L}\p{N}\s@.\-_]/gu, " ").trim().slice(0, 80);
}

customersRouter.get("/", async (req, res) => {
  const search = typeof req.query.q === "string" ? safeQ(req.query.q) : "";
  const paged = req.query.limit !== undefined || req.query.offset !== undefined;
  const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 100));
  const offset = Math.max(0, Number(req.query.offset) || 0);

  let q = supabase
    .from("customers")
    .select("*", paged ? { count: "exact" } : undefined)
    .order("created_at", { ascending: false });
  if (search) q = q.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
  q = paged ? q.range(offset, offset + limit - 1) : q.limit(1000);

  const { data, error, count } = await q;
  if (error) return serverError(res, "customers.list", error);
  if (paged) return res.json({ items: data ?? [], total: count ?? 0 });
  res.json(data ?? []);
});

// Eksport CSV (np. do mailingu / CRM). Rejestrowane PRZED /:id.
customersRouter.get("/export.csv", async (_req, res) => {
  const { data, error } = await supabase
    .from("customers")
    .select("email, name, phone, created_at")
    .order("created_at", { ascending: false })
    .limit(10000);
  if (error) return serverError(res, "customers.export", error);
  sendCsv(
    res,
    "klienci.csv",
    ["E-mail", "Imię i nazwisko", "Telefon", "Data pierwszego zamówienia"],
    (data ?? []).map((c) => [c.email, c.name ?? "", c.phone ?? "", new Date(c.created_at).toLocaleString("pl-PL")]),
  );
});

// ── Zarejestrowane KONTA klientów (Supabase Auth + profil) ────
// Statystyki zamówień liczy SQL (RPC admin_account_stats) - bez pętli w JS.
customersRouter.get("/accounts", async (_req, res) => {
  try {
    const { data: list, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return serverError(res, "accounts.list", error);
    const users = list?.users ?? [];

    const [{ data: profiles }, { data: statRows }] = await Promise.all([
      supabase.from("account_profiles").select("user_id, full_name, phone, marketing_consent"),
      supabase.rpc("admin_account_stats"),
    ]);
    const profById = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    const stats = new Map(
      ((statRows ?? []) as { user_id: string; orders: number; spent_grosze: number }[]).map((s) => [
        s.user_id,
        { orders: s.orders, spentGrosze: Number(s.spent_grosze) },
      ]),
    );

    const accounts = users
      .map((u) => {
        const p = profById.get(u.id);
        const s = stats.get(u.id) ?? { orders: 0, spentGrosze: 0 };
        return {
          id: u.id,
          email: u.email ?? "",
          name: p?.full_name ?? u.user_metadata?.full_name ?? "",
          phone: p?.phone ?? "",
          marketingConsent: !!p?.marketing_consent,
          createdAt: u.created_at,
          lastSignInAt: u.last_sign_in_at ?? null,
          orders: s.orders,
          spentGrosze: s.spentGrosze,
        };
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    res.json(accounts);
  } catch (e) {
    return serverError(res, "accounts.list", e);
  }
});

// RODO - usunięcie konta klienta na żądanie (z panelu). Atomowo (RPC): profil +
// adresy + kopia PII w `customers` znikają; zamówienia zostają, odpięte od konta.
customersRouter.delete("/accounts/:userId", async (req, res) => {
  if (badId(res, req.params.userId)) return;
  const userId = req.params.userId;
  const { data: u } = await supabase.auth.admin.getUserById(userId);
  const email = u?.user?.email ?? "";
  const { error: rpcErr } = await supabase.rpc("delete_customer_account", { p_user: userId, p_email: email });
  if (rpcErr) return serverError(res, "accounts.delete.rpc", rpcErr);
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return serverError(res, "accounts.delete", error);
  res.json({ ok: true });
});

customersRouter.get("/:id", async (req, res) => {
  if (badId(res, req.params.id)) return;
  const { data: customer, error } = await supabase.from("customers").select("*").eq("id", req.params.id).maybeSingle();
  if (error) return serverError(res, "customers.get", error);
  if (!customer) return res.status(404).json({ error: "Nie znaleziono" });
  const [{ data: orders }, { data: reviews }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, number, status, payment_status, total_grosze, created_at")
      .eq("customer_id", req.params.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("product_reviews")
      .select("id, rating, body, status, created_at, product:products(name, slug)")
      .in(
        "order_id",
        (
          await supabase.from("orders").select("id").eq("customer_id", req.params.id)
        ).data?.map((o) => o.id) ?? [],
      )
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  res.json({ ...customer, orders: orders ?? [], reviews: reviews ?? [] });
});
