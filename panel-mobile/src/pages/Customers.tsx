import { useEffect, useState } from "react";
import { api } from "../api";
import { dateShort, STATUS_LABELS, zl } from "../format";
import { Spinner, ErrorNote, Empty, Sheet } from "../ui";
import Icon from "../icons";

type Customer = { id: string; email: string; name: string | null; phone: string | null; created_at: string };
type Detail = Customer & { orders: { id: string; number: string; status: string; total_grosze: number; created_at: string }[] };

type Account = {
  id: string;
  email: string;
  name: string;
  phone: string;
  marketingConsent: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  orders: number;
  spentGrosze: number;
};

export default function Customers() {
  const [tab, setTab] = useState<"klienci" | "konta">("klienci");
  return (
    <div className="pb-8">
      <div className="p-4 pb-0">
        <div className="flex rounded-xl bg-cream p-1 text-sm font-medium">
          <button
            onClick={() => setTab("klienci")}
            className={`flex-1 rounded-lg py-2 transition-colors ${tab === "klienci" ? "bg-white shadow-sm" : "text-ash"}`}
          >
            Klienci
          </button>
          <button
            onClick={() => setTab("konta")}
            className={`flex-1 rounded-lg py-2 transition-colors ${tab === "konta" ? "bg-white shadow-sm" : "text-ash"}`}
          >
            Konta
          </button>
        </div>
      </div>
      {tab === "klienci" ? <KlienciList /> : <KontaList />}
    </div>
  );
}

function KlienciList() {
  const [items, setItems] = useState<Customer[]>([]);
  const [open, setOpen] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/api/admin/customers").then(setItems).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, []);

  async function show(c: Customer) {
    try {
      setOpen(await api.get(`/api/admin/customers/${c.id}`));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="space-y-2.5 p-4">
      {err && <ErrorNote msg={err} />}
      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty emoji="🐾" title="Brak klientów" hint="Tu pojawią się osoby, które złożyły zamówienie." />
      ) : (
        items.map((c) => (
          <button key={c.id} className="listcard w-full" onClick={() => show(c)}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cream font-semibold text-orange-deep">
              {(c.name ?? c.email).slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{c.name ?? c.email}</div>
              <div className="truncate text-xs text-ash">
                {c.email}
                {c.phone ? ` - ${c.phone}` : ""}
              </div>
            </div>
            <Icon name="chevron" size={18} className="shrink-0 text-ash" />
          </button>
        ))
      )}

      {open && (
        <Sheet title={open.name ?? open.email} onClose={() => setOpen(null)}>
          <div className="space-y-3">
            <div className="text-sm text-ash">
              {open.email}
              {open.phone ? ` - ${open.phone}` : ""}
            </div>
            <div className="text-sm font-semibold">Zamówienia ({open.orders.length})</div>
            {open.orders.length === 0 ? (
              <Empty emoji="📭" title="Brak zamówień" />
            ) : (
              <div className="card divide-y divide-line overflow-hidden">
                {open.orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium">{o.number}</div>
                      <div className="text-xs text-ash">{STATUS_LABELS[o.status] ?? o.status} - {dateShort(o.created_at)}</div>
                    </div>
                    <span className="tabular-nums">{zl(o.total_grosze)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}

function KontaList() {
  const [items, setItems] = useState<Account[]>([]);
  const [open, setOpen] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/api/admin/customers/accounts").then(setItems).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, []);

  async function removeAccount(a: Account) {
    if (!confirm(`Usunąć konto ${a.email}? (RODO - profil i adresy znikną, zamówienia zostaną odpięte)`)) return;
    try {
      await api.del(`/api/admin/customers/accounts/${a.id}`);
      setItems((list) => list.filter((x) => x.id !== a.id));
      setOpen(null);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  const consents = items.filter((a) => a.marketingConsent).length;

  return (
    <div className="space-y-2.5 p-4">
      {err && <ErrorNote msg={err} />}
      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty emoji="🐾" title="Brak kont" hint="Tu pojawią się klienci, którzy założą konto na stronie." />
      ) : (
        <>
          <div className="px-1 text-xs text-ash">
            {items.length} {items.length === 1 ? "konto" : "kont"} - {consents} ze zgodą na newsletter
          </div>
          {items.map((a) => (
            <button key={a.id} className="listcard w-full" onClick={() => setOpen(a)}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cream font-semibold text-orange-deep">
                {(a.name || a.email).slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium">{a.name || a.email}</span>
                  {a.marketingConsent && <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">news</span>}
                </div>
                <div className="truncate text-xs text-ash">
                  {a.email} - {a.orders} zam. - {zl(a.spentGrosze)}
                </div>
              </div>
              <Icon name="chevron" size={18} className="shrink-0 text-ash" />
            </button>
          ))}
        </>
      )}

      {open && (
        <Sheet
          title={open.name || open.email}
          onClose={() => setOpen(null)}
          footer={
            <button
              onClick={() => removeAccount(open)}
              className="w-full rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-700 active:bg-red-50"
            >
              Usuń konto (RODO)
            </button>
          }
        >
          <div className="space-y-3 text-sm">
            <Row label="E-mail" value={open.email} />
            {open.phone && <Row label="Telefon" value={open.phone} />}
            <Row label="Newsletter" value={open.marketingConsent ? "Tak (zgoda)" : "Nie"} />
            <Row label="Zamówienia" value={String(open.orders)} />
            <Row label="Wydane" value={zl(open.spentGrosze)} />
            <Row label="Konto od" value={dateShort(open.createdAt)} />
            {open.lastSignInAt && <Row label="Ostatnie logowanie" value={dateShort(open.lastSignInAt)} />}
          </div>
        </Sheet>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
      <span className="text-ash">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
