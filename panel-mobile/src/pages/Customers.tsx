import { useEffect, useState } from "react";
import { api } from "../api";
import { dateShort, STATUS_LABELS, zl } from "../format";
import { Spinner, ErrorNote, Empty, Sheet } from "../ui";
import Icon from "../icons";

type Customer = { id: string; email: string; name: string | null; phone: string | null; created_at: string };
type Detail = Customer & { orders: { id: string; number: string; status: string; total_grosze: number; created_at: string }[] };

export default function Customers() {
  const [items, setItems] = useState<Customer[]>([]);
  const [open, setOpen] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .get("/api/admin/customers")
      .then((d) => setItems(d))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function show(c: Customer) {
    try {
      setOpen(await api.get(`/api/admin/customers/${c.id}`));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="pb-8">
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
                  {c.phone ? ` · ${c.phone}` : ""}
                </div>
              </div>
              <Icon name="chevron" size={18} className="shrink-0 text-ash" />
            </button>
          ))
        )}
      </div>

      {open && (
        <Sheet title={open.name ?? open.email} onClose={() => setOpen(null)}>
          <div className="space-y-3">
            <div className="text-sm text-ash">
              {open.email}
              {open.phone ? ` · ${open.phone}` : ""}
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
                      <div className="text-xs text-ash">{STATUS_LABELS[o.status] ?? o.status} · {dateShort(o.created_at)}</div>
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
