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

// ── Zarejestrowane KONTA klientów (Supabase Auth + profil) ────
// Dla paneli: kto założył konto, zgoda marketingowa, liczba i wartość zamówień.
customersRouter.get("/accounts", async (_req, res) => {
  try {
    const { data: list, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return serverError(res, "accounts.list", error);
    const users = list?.users ?? [];

    const { data: profiles } = await supabase
      .from("account_profiles")
      .select("user_id, full_name, phone, marketing_consent");
    const profById = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    const { data: orders } = await supabase
      .from("orders")
      .select("user_id, total_grosze, payment_status")
      .not("user_id", "is", null)
      .limit(5000);
    const stats = new Map<string, { orders: number; spentGrosze: number }>();
    for (const o of orders ?? []) {
      const uid = o.user_id as string;
      const s = stats.get(uid) ?? { orders: 0, spentGrosze: 0 };
      s.orders += 1;
      if (o.payment_status === "paid") s.spentGrosze += o.total_grosze ?? 0;
      stats.set(uid, s);
    }

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

// RODO — usunięcie konta klienta na żądanie (z panelu). Zamówienia zostają, odpięte.
customersRouter.delete("/accounts/:userId", async (req, res) => {
  if (badId(res, req.params.userId)) return;
  const userId = req.params.userId;
  await supabase.from("account_addresses").delete().eq("user_id", userId);
  await supabase.from("account_profiles").delete().eq("user_id", userId);
  await supabase.from("orders").update({ user_id: null }).eq("user_id", userId);
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return serverError(res, "accounts.delete", error);
  res.json({ ok: true });
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
