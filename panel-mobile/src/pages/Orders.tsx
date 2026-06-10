import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import { dateShort, dateStr, PAYMENT_LABELS, STATUS_LABELS, STATUS_TONE, zl } from "../format";
import { Spinner, ErrorNote, Empty, Sheet, StatusPill, toast } from "../ui";
import Icon from "../icons";

type Item = { id: string; name: string; qty: number; price_grosze: number; image_url?: string | null };
type Order = {
  id: string;
  number: string;
  email: string;
  phone: string | null;
  status: string;
  payment_status: string;
  subtotal_grosze: number;
  discount_grosze: number;
  shipping_grosze: number;
  total_grosze: number;
  promo_code: string | null;
  shipping_method: string | null;
  shipping_address: Record<string, unknown> | null;
  parcel_locker: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  items: Item[];
};

const STATUSES = ["pending", "paid", "packed", "shipped", "delivered", "cancelled", "refunded"];
const FILTERS = [{ k: "", l: "Wszystkie" }, ...STATUSES.map((s) => ({ k: s, l: STATUS_LABELS[s] }))];
const RANGES = [
  { k: "", l: "Cały czas" },
  { k: "1", l: "Dziś" },
  { k: "7", l: "7 dni" },
  { k: "30", l: "30 dni" },
] as const;
const PAGE = 30;

export default function Orders() {
  const [items, setItems] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [range, setRange] = useState<(typeof RANGES)[number]["k"]>("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [err, setErr] = useState("");
  // tryb zaznaczania (masowa zmiana statusu)
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildQuery = useCallback(
    (offset: number) => {
      const p = new URLSearchParams();
      p.set("limit", String(PAGE));
      p.set("offset", String(offset));
      if (filter) p.set("status", filter);
      if (q.trim()) p.set("q", q.trim());
      if (range) {
        const from = new Date();
        from.setHours(0, 0, 0, 0);
        from.setDate(from.getDate() - (Number(range) - 1));
        p.set("from", from.toISOString());
      }
      return `/api/admin/orders?${p.toString()}`;
    },
    [filter, q, range],
  );

  const load = useCallback(
    async (offset = 0) => {
      offset === 0 ? setLoading(true) : setMore(true);
      setErr("");
      try {
        const d = (await api.get(buildQuery(offset))) as { items: Order[]; total: number };
        setItems((cur) => (offset === 0 ? d.items : [...cur, ...d.items]));
        setTotal(d.total);
      } catch (e) {
        setErr((e as Error).message);
      }
      setLoading(false);
      setMore(false);
    },
    [buildQuery],
  );

  // filtr/zakres: od razu; szukajka: debounce 300 ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void load(0), q ? 300 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [load, q]);

  function toggleSelected(id: string) {
    setSelected((cur) => {
      const next = new Set(cur);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function bulkSetStatus(status: string) {
    try {
      const d = (await api.patch("/api/admin/orders/bulk", { ids: [...selected], status })) as { updated: number };
      toast(`Zmieniono status ${d.updated} zamówień`);
      setBulkOpen(false);
      setSelectMode(false);
      setSelected(new Set());
      void load(0);
    } catch (e) {
      toast((e as Error).message, "err");
    }
  }

  return (
    <div className="pb-8">
      {/* Szukajka */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3">
          <Icon name="search" size={18} className="shrink-0 text-ash" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Szukaj: numer lub e-mail"
            className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-mist"
          />
          {q && (
            <button onClick={() => setQ("")} className="shrink-0 text-ash" aria-label="Wyczyść">
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filtry statusu */}
      <div className="noscrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {FILTERS.map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k)} className={`pill ${filter === f.k ? "pill-on" : "pill-off"}`}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Zakres dat + tryb zaznaczania */}
      <div className="noscrollbar -mt-1 flex items-center gap-2 overflow-x-auto px-4 pb-3">
        {RANGES.map((r) => (
          <button key={r.k} onClick={() => setRange(r.k)} className={`pill ${range === r.k ? "pill-on" : "pill-off"}`}>
            {r.l}
          </button>
        ))}
        <span className="mx-1 h-5 w-px shrink-0 bg-line" />
        <button
          onClick={() => {
            setSelectMode((v) => !v);
            setSelected(new Set());
          }}
          className={`pill ${selectMode ? "pill-on" : "pill-off"}`}
        >
          {selectMode ? "Anuluj zaznaczanie" : "Zaznacz"}
        </button>
      </div>

      <div className="space-y-2.5 px-4">
        {err && <ErrorNote msg={err} />}
        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <Empty emoji="🧾" title="Brak zamówień" hint={q || filter || range ? "Zmień filtry lub frazę." : "Tu pojawią się zamówienia ze sklepu."} />
        ) : (
          <>
            {items.map((o) => {
              const img = o.items?.[0]?.image_url;
              const checked = selected.has(o.id);
              return (
                <button
                  key={o.id}
                  onClick={() => (selectMode ? toggleSelected(o.id) : setOpen(o))}
                  className={`listcard w-full ${selectMode && checked ? "ring-2 ring-orange" : ""}`}
                >
                  {selectMode && (
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${
                        checked ? "border-orange bg-orange text-white" : "border-line bg-white"
                      }`}
                    >
                      {checked && <Icon name="check" size={14} />}
                    </span>
                  )}
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-line bg-cream">
                    {img ? (
                      <img src={img} className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-ash">
                        <Icon name="orders" size={20} />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{o.number}</span>
                      <span className="shrink-0 font-semibold tabular-nums">{zl(o.total_grosze)}</span>
                    </div>
                    <div className="truncate text-xs text-ash">{o.email}</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <StatusPill label={STATUS_LABELS[o.status] ?? o.status} tone={STATUS_TONE[o.status] ?? "bg-cream text-ash"} />
                      <span className="text-[11px] text-ash">{dateShort(o.created_at)}</span>
                      {o.payment_status === "paid" && <span className="text-[11px] font-medium text-emerald-600">opłacone</span>}
                      {o.notes?.startsWith("🎁") && <span className="text-[11px]">🎁</span>}
                    </div>
                  </div>
                </button>
              );
            })}

            {items.length < total && (
              <button onClick={() => load(items.length)} disabled={more} className="btn-ghost w-full">
                {more ? "Wczytuję..." : `Załaduj więcej (${total - items.length})`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Pasek akcji masowych */}
      {selectMode && selected.size > 0 && (
        <div
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 78px)" }}
          className="fixed inset-x-4 z-30 flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-white shadow-xl"
        >
          <span className="text-sm font-medium">Zaznaczone: {selected.size}</span>
          <button onClick={() => setBulkOpen(true)} className="rounded-xl bg-orange px-4 py-2 text-sm font-semibold active:scale-[0.97]">
            Zmień status
          </button>
        </div>
      )}

      {bulkOpen && (
        <Sheet title={`Nowy status dla ${selected.size} zamówień`} onClose={() => setBulkOpen(false)}>
          <div className="flex flex-col gap-2">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => void bulkSetStatus(s)} className="listcard w-full justify-between">
                <StatusPill label={STATUS_LABELS[s]} tone={STATUS_TONE[s] ?? "bg-cream text-ash"} />
                <Icon name="chevron" size={16} className="text-ash" />
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {open && <Detail order={open} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); void load(0); }} />}
    </div>
  );
}

function Detail({ order, onClose, onSaved }: { order: Order; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState(order.status);
  const [payment, setPayment] = useState(order.payment_status);
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [notes, setNotes] = useState(order.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [shipBusy, setShipBusy] = useState(false);
  const [shipMsg, setShipMsg] = useState("");
  const addr = order.shipping_address ?? {};
  const isInpost = order.shipping_method === "inpost_locker" || order.shipping_method === "inpost_courier";

  async function save() {
    setSaving(true);
    setErr("");
    try {
      await api.patch(`/api/admin/orders/${order.id}`, {
        status,
        payment_status: payment,
        tracking_number: tracking || null,
        notes: notes || null,
      });
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    }
    setSaving(false);
  }

  async function genLabel() {
    setShipBusy(true);
    setShipMsg("");
    try {
      const r = await api.post(`/api/admin/orders/${order.id}/label`, {});
      if (r?.tracking_number) setTracking(r.tracking_number);
      setStatus("packed");
      setShipMsg(`Przesyłka utworzona${r?.tracking_number ? ` - ${r.tracking_number}` : ""}.`);
    } catch (e) {
      setShipMsg((e as Error).message);
    }
    setShipBusy(false);
  }

  async function openLabel() {
    setShipBusy(true);
    setShipMsg("");
    try {
      const blob = await api.getBlob(`/api/admin/orders/${order.id}/label-file`);
      // pobranie przez <a download> działa też w PWA standalone na iOS (window.open bywa blokowany)
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `etykieta-${order.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setShipMsg("Etykieta pobrana ✓");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setShipMsg((e as Error).message);
    }
    setShipBusy(false);
  }

  return (
    <Sheet
      title={order.number}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onClose}>Zamknij</button>
          <button className="btn-primary flex-1" onClick={save} disabled={saving}>{saving ? "Zapisuję..." : "Zapisz"}</button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="text-xs text-ash">{dateStr(order.created_at)}</div>

        {/* Pozycje */}
        <div className="card p-4">
          <div className="mb-2 text-sm font-semibold">Pozycje</div>
          <div className="divide-y divide-line">
            {order.items?.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{it.name}</span>
                <span className="shrink-0 text-ash">{it.qty}x</span>
                <span className="shrink-0 tabular-nums">{zl(it.price_grosze * it.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
            <Row l="Produkty" v={zl(order.subtotal_grosze)} />
            {order.discount_grosze > 0 && <Row l={`Rabat ${order.promo_code ? `(${order.promo_code})` : ""}`} v={`-${zl(order.discount_grosze)}`} />}
            <Row l="Dostawa" v={zl(order.shipping_grosze)} />
            <Row l="Razem" v={zl(order.total_grosze)} bold />
          </div>
        </div>

        {/* Klient */}
        <div className="card p-4 text-sm">
          <div className="mb-1 font-semibold">Klient i dostawa</div>
          <div className="text-ash">{order.email}{order.phone ? ` - ${order.phone}` : ""}</div>
          <div className="mt-1 text-ash">
            {order.shipping_method ?? ""} {order.parcel_locker ? `- ${order.parcel_locker}` : ""}
          </div>
          {Object.keys(addr).length > 0 && (
            <div className="mt-1 text-ash">
              {[addr["street"], addr["building_number"], addr["post_code"], addr["city"]].filter(Boolean).join(", ")}
            </div>
          )}
        </div>

        {/* InPost */}
        {isInpost && (
          <div className="card p-4 text-sm">
            <div className="mb-2 font-semibold">Przesyłka InPost</div>
            <div className="flex flex-col gap-2">
              <button className="btn-orange w-full" onClick={genLabel} disabled={shipBusy}>
                {shipBusy ? "Pracuję..." : "Generuj etykietę"}
              </button>
              <button className="btn-ghost w-full" onClick={openLabel} disabled={shipBusy}>Pobierz etykietę (PDF)</button>
            </div>
            {shipMsg && <p className="mt-2 text-ash">{shipMsg}</p>}
          </div>
        )}

        {/* Status / płatność */}
        <div className="card space-y-3 p-4">
          <div>
            <label className="label">Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Płatność</label>
            <select className="input" value={payment} onChange={(e) => setPayment(e.target.value)}>
              {Object.keys(PAYMENT_LABELS).map((s) => (
                <option key={s} value={s}>{PAYMENT_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Numer przesyłki</label>
            <input className="input" value={tracking} onChange={(e) => setTracking(e.target.value)} />
          </div>
          <div>
            <label className="label">Notatka</label>
            <textarea className="input min-h-[70px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {err && <ErrorNote msg={err} />}
        </div>
      </div>
    </Sheet>
  );
}

function Row({ l, v, bold }: { l: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : "text-ash"}`}>
      <span>{l}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
}
