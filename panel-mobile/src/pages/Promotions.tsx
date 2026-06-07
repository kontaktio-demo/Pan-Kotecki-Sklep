import { useEffect, useState } from "react";
import { api } from "../api";
import { fromGrosze, toGrosze, zl } from "../format";
import { Spinner, ErrorNote, Empty, Sheet, Fab, StatusPill } from "../ui";
import Icon from "../icons";

type Promo = {
  id?: string;
  code: string;
  name: string;
  kind: "percent" | "fixed";
  value: number;
  min_order_grosze: number;
  active: boolean;
  usage_limit: number | null;
  used_count?: number;
};
const empty: Promo = { code: "", name: "", kind: "percent", value: 10, min_order_grosze: 0, active: true, usage_limit: null };

export default function Promotions() {
  const [items, setItems] = useState<Promo[]>([]);
  const [editing, setEditing] = useState<Promo | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    try {
      setItems(await api.get("/api/admin/promotions"));
    } catch (e) {
      setErr((e as Error).message);
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function remove(p: Promo) {
    if (!confirm(`Usunąć kod „${p.code}"?`)) return;
    await api.del(`/api/admin/promotions/${p.id}`);
    load();
  }

  return (
    <div className="pb-24">
      <div className="space-y-2.5 p-4">
        {err && <ErrorNote msg={err} />}
        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <Empty emoji="🏷️" title="Brak kodów" hint="Dodaj kod rabatowy przyciskiem +" />
        ) : (
          items.map((p) => (
            <div key={p.id} className="listcard">
              <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(p)}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold">{p.code}</span>
                  <StatusPill label={p.active ? "Aktywny" : "Wyłączony"} tone={p.active ? "bg-emerald-100 text-emerald-700" : "bg-cream text-ash"} />
                </div>
                <div className="mt-0.5 text-xs text-ash">
                  Rabat {p.kind === "percent" ? `${p.value}%` : zl(p.value)}
                  {p.min_order_grosze ? ` · od ${zl(p.min_order_grosze)}` : ""}
                  {` · użyto ${p.used_count ?? 0}${p.usage_limit != null ? `/${p.usage_limit}` : ""}`}
                </div>
              </button>
              <button onClick={() => remove(p)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-red-500 active:bg-red-50">
                <Icon name="trash" size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      <Fab onClick={() => setEditing({ ...empty })} label="Dodaj" />

      {editing && <Editor promo={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function Editor({ promo, onClose, onSaved }: { promo: Promo; onClose: () => void; onSaved: () => void }) {
  const [p, setP] = useState<Promo>(promo);
  const [valueInput, setValueInput] = useState(promo.kind === "fixed" ? fromGrosze(promo.value) : String(promo.value));
  const [minInput, setMinInput] = useState(promo.min_order_grosze ? fromGrosze(promo.min_order_grosze) : "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true);
    setErr("");
    let value = p.kind === "fixed" ? toGrosze(valueInput) : Math.round(Number(valueInput) || 0);
    if (p.kind === "percent") value = Math.min(100, Math.max(1, value)); // procent 1–100
    value = Math.max(0, value);
    const payload = {
      code: p.code,
      name: p.name,
      kind: p.kind,
      value,
      min_order_grosze: minInput.trim() ? toGrosze(minInput) : 0,
      active: p.active,
      usage_limit: p.usage_limit,
    };
    try {
      if (p.id) await api.patch(`/api/admin/promotions/${p.id}`, payload);
      else await api.post("/api/admin/promotions", payload);
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    }
    setSaving(false);
  }

  return (
    <Sheet
      title={p.id ? "Edytuj kod" : "Nowy kod rabatowy"}
      onClose={onClose}
      footer={<button className="btn-primary w-full" onClick={save} disabled={saving || !p.code.trim()}>{saving ? "Zapisuję…" : "Zapisz"}</button>}
    >
      <div className="space-y-3">
        <div>
          <label className="label">Kod</label>
          <input className="input font-mono uppercase" value={p.code} onChange={(e) => setP({ ...p, code: e.target.value.toUpperCase() })} />
        </div>
        <div>
          <label className="label">Nazwa (opis)</label>
          <input className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Typ</label>
            <select className="input" value={p.kind} onChange={(e) => setP({ ...p, kind: e.target.value as Promo["kind"] })}>
              <option value="percent">Procent (%)</option>
              <option value="fixed">Kwota (zł)</option>
            </select>
          </div>
          <div>
            <label className="label">{p.kind === "percent" ? "Wartość (%)" : "Wartość (zł)"}</label>
            <input className="input" inputMode="decimal" value={valueInput} onChange={(e) => setValueInput(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Min. zamówienie (zł)</label>
            <input className="input" inputMode="decimal" value={minInput} placeholder="—" onChange={(e) => setMinInput(e.target.value)} />
          </div>
          <div>
            <label className="label">Limit użyć</label>
            <input
              className="input"
              inputMode="numeric"
              value={p.usage_limit ?? ""}
              placeholder="∞"
              onChange={(e) => setP({ ...p, usage_limit: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-orange" checked={p.active} onChange={(e) => setP({ ...p, active: e.target.checked })} /> Aktywny
        </label>
        {err && <ErrorNote msg={err} />}
      </div>
    </Sheet>
  );
}
