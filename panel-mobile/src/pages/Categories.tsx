import { useEffect, useState } from "react";
import { api } from "../api";
import { Spinner, ErrorNote, Empty, Sheet, Fab } from "../ui";
import Icon from "../icons";

type Cat = { id?: string; slug?: string; name: string; tagline: string; sort_order: number };
const empty: Cat = { name: "", tagline: "", sort_order: 0 };

export default function Categories() {
  const [items, setItems] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    try {
      setItems(await api.get("/api/admin/categories"));
    } catch (e) {
      setErr((e as Error).message);
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function remove(c: Cat) {
    if (!confirm(`Usunąć kategorię „${c.name}"? Produkty w niej zostaną bez kategorii.`)) return;
    await api.del(`/api/admin/categories/${c.id}`);
    load();
  }

  return (
    <div className="pb-24">
      <div className="space-y-2.5 p-4">
        {err && <ErrorNote msg={err} />}
        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <Empty emoji="🗂️" title="Brak kategorii" hint="Dodaj pierwszą przyciskiem +" />
        ) : (
          items.map((c) => (
            <div key={c.id} className="listcard">
              <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(c)}>
                <div className="truncate font-semibold">{c.name}</div>
                <div className="truncate text-xs text-ash">{c.tagline || "-"}</div>
              </button>
              <button onClick={() => remove(c)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-red-500 active:bg-red-50">
                <Icon name="trash" size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      <Fab onClick={() => setEditing({ ...empty })} label="Dodaj" />

      {editing && <Editor cat={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function Editor({ cat, onClose, onSaved }: { cat: Cat; onClose: () => void; onSaved: () => void }) {
  const [c, setC] = useState<Cat>(cat);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true);
    setErr("");
    try {
      const payload = { name: c.name, slug: c.slug || undefined, tagline: c.tagline, sort_order: Number(c.sort_order) || 0 };
      if (c.id) await api.patch(`/api/admin/categories/${c.id}`, payload);
      else await api.post("/api/admin/categories", payload);
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    }
    setSaving(false);
  }

  return (
    <Sheet
      title={c.id ? "Edytuj kategorię" : "Nowa kategoria"}
      onClose={onClose}
      footer={<button className="btn-primary w-full" onClick={save} disabled={saving || !c.name.trim()}>{saving ? "Zapisuję..." : "Zapisz"}</button>}
    >
      <div className="space-y-3">
        <div>
          <label className="label">Nazwa</label>
          <input className="input" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Hasło (tagline)</label>
          <input className="input" value={c.tagline} onChange={(e) => setC({ ...c, tagline: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Slug (opcjonalnie)</label>
            <input className="input" value={c.slug ?? ""} placeholder="auto" onChange={(e) => setC({ ...c, slug: e.target.value })} />
          </div>
          <div>
            <label className="label">Kolejność</label>
            <input className="input" inputMode="numeric" value={c.sort_order} onChange={(e) => setC({ ...c, sort_order: Number(e.target.value) || 0 })} />
          </div>
        </div>
        {err && <ErrorNote msg={err} />}
      </div>
    </Sheet>
  );
}
