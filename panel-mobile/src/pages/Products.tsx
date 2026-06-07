import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { fromGrosze, toGrosze, zl } from "../format";
import { Spinner, ErrorNote, Empty, Sheet, Fab } from "../ui";
import Icon from "../icons";

type Img = { id: string; url: string; alt: string | null; sort_order: number };
type Product = {
  id?: string;
  slug?: string;
  name: string;
  category_id: string | null;
  price_grosze: number;
  sale_price_grosze: number | null;
  short_description: string;
  description: string;
  details: string[];
  badges: string[];
  bestseller: boolean;
  in_stock: boolean;
  stock_qty: number | null;
  active: boolean;
  sort_order: number;
  category?: { name: string } | null;
  images?: Img[];
};
type Cat = { id: string; name: string };

const empty: Product = {
  name: "",
  category_id: null,
  price_grosze: 0,
  sale_price_grosze: null,
  short_description: "",
  description: "",
  details: [],
  badges: [],
  bestseller: false,
  in_stock: true,
  stock_qty: null,
  active: true,
  sort_order: 0,
};

export default function Products() {
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [p, c] = await Promise.all([api.get("/api/admin/products"), api.get("/api/admin/categories")]);
      setItems(p);
      setCats(c);
    } catch (e) {
      setErr((e as Error).message);
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function remove(p: Product) {
    if (!confirm(`Usunąć produkt „${p.name}"? Tego nie da się cofnąć.`)) return;
    try {
      await api.del(`/api/admin/products/${p.id}`);
      load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  const filtered = items.filter((p) => p.name.toLowerCase().includes(q.toLowerCase().trim()));

  return (
    <div className="pb-24">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5">
          <Icon name="search" size={18} className="text-ash" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Szukaj produktu..."
            className="w-full bg-transparent text-[15px] outline-none"
            autoCapitalize="none"
          />
        </div>
      </div>

      <div className="space-y-2.5 px-4">
        {err && <ErrorNote msg={err} />}
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <Empty emoji="🛍️" title={q ? "Nic nie znaleziono" : "Brak produktów"} hint={q ? undefined : "Dodaj pierwszy produkt przyciskiem +"} />
        ) : (
          filtered.map((p) => (
            <div key={p.id} className="listcard">
              <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setEditing(p)}>
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-line bg-cream">
                  {p.images?.[0] ? (
                    <img src={p.images[0].url} className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-ash">
                      <Icon name="products" size={20} />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{p.name}</div>
                  <div className="text-xs text-ash">{p.category?.name ?? "-"}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-semibold tabular-nums">{zl(p.sale_price_grosze ?? p.price_grosze)}</span>
                    {p.sale_price_grosze != null && <span className="text-xs text-ash line-through">{zl(p.price_grosze)}</span>}
                    {!p.active && <span className="statuspill bg-cream text-ash">Ukryty</span>}
                    {p.bestseller && <span className="statuspill bg-orange/15 text-orange-deep">Bestseller</span>}
                  </div>
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

      {editing && (
        <Editor
          initial={editing}
          cats={cats}
          onChanged={(saved) => setEditing(saved)}
          onClose={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function Editor({
  initial,
  cats,
  onChanged,
  onClose,
}: {
  initial: Product;
  cats: Cat[];
  onChanged: (p: Product) => void;
  onClose: () => void;
}) {
  const [p, setP] = useState<Product>(initial);
  const [priceZl, setPriceZl] = useState(fromGrosze(initial.price_grosze));
  const [saleZl, setSaleZl] = useState(initial.sale_price_grosze != null ? fromGrosze(initial.sale_price_grosze) : "");
  const [detailsText, setDetailsText] = useState((initial.details ?? []).join("\n"));
  const [badgesText, setBadgesText] = useState((initial.badges ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof Product>(key: K, value: Product[K]) {
    setP((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setErr("");
    const payload = {
      name: p.name,
      slug: p.slug || undefined,
      category_id: p.category_id || null,
      price_grosze: toGrosze(priceZl),
      sale_price_grosze: saleZl.trim() ? toGrosze(saleZl) : null,
      short_description: p.short_description,
      description: p.description,
      details: detailsText.split("\n").map((s) => s.trim()).filter(Boolean),
      badges: badgesText.split(",").map((s) => s.trim()).filter(Boolean),
      bestseller: p.bestseller,
      in_stock: p.in_stock,
      stock_qty: p.stock_qty,
      active: p.active,
      sort_order: Number(p.sort_order) || 0,
    };
    try {
      const saved = p.id
        ? await api.patch(`/api/admin/products/${p.id}`, payload)
        : await api.post("/api/admin/products", payload);
      setP(saved);
      onChanged(saved);
    } catch (e) {
      setErr((e as Error).message);
    }
    setSaving(false);
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || !p.id) return;
    setErr("");
    try {
      for (const f of Array.from(files)) await api.upload(`/api/admin/products/${p.id}/images`, f);
      const fresh = await api.get(`/api/admin/products/${p.id}`);
      setP(fresh);
      onChanged(fresh);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function removeImage(id: string) {
    await api.del(`/api/admin/products/images/${id}`);
    const fresh = await api.get(`/api/admin/products/${p.id}`);
    setP(fresh);
    onChanged(fresh);
  }

  return (
    <Sheet
      title={p.id ? "Edytuj produkt" : "Nowy produkt"}
      onClose={onClose}
      footer={<button className="btn-primary w-full" onClick={save} disabled={saving || !p.name.trim()}>{saving ? "Zapisuję..." : "Zapisz"}</button>}
    >
      <div className="space-y-4">
        <div>
          <label className="label">Nazwa</label>
          <input className="input" value={p.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Cena (zł)</label>
            <input className="input" inputMode="decimal" value={priceZl} onChange={(e) => setPriceZl(e.target.value)} />
          </div>
          <div>
            <label className="label">Promocyjna (zł)</label>
            <input className="input" inputMode="decimal" value={saleZl} onChange={(e) => setSaleZl(e.target.value)} placeholder="-" />
          </div>
        </div>
        <div>
          <label className="label">Kategoria</label>
          <select className="input" value={p.category_id ?? ""} onChange={(e) => set("category_id", e.target.value || null)}>
            <option value="">- brak -</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Krótki opis</label>
          <input className="input" value={p.short_description} onChange={(e) => set("short_description", e.target.value)} />
        </div>
        <div>
          <label className="label">Opis</label>
          <textarea className="input min-h-[100px]" value={p.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div>
          <label className="label">Szczegóły (każdy w nowej linii)</label>
          <textarea className="input min-h-[80px]" value={detailsText} onChange={(e) => setDetailsText(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Plakietki (po przecinku)</label>
            <input className="input" value={badgesText} onChange={(e) => setBadgesText(e.target.value)} placeholder="Bestseller" />
          </div>
          <div>
            <label className="label">Stan magazynowy</label>
            <input
              className="input"
              inputMode="numeric"
              value={p.stock_qty ?? ""}
              placeholder="∞"
              onChange={(e) => set("stock_qty", e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
        </div>
        <div>
          <label className="label">Slug (opcjonalnie)</label>
          <input className="input" value={p.slug ?? ""} placeholder="auto z nazwy" onChange={(e) => set("slug", e.target.value)} />
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-orange" checked={p.active} onChange={(e) => set("active", e.target.checked)} /> Widoczny
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-orange" checked={p.in_stock} onChange={(e) => set("in_stock", e.target.checked)} /> Dostępny
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-orange" checked={p.bestseller} onChange={(e) => set("bestseller", e.target.checked)} /> Bestseller
          </label>
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold">Zdjęcia</div>
          {!p.id ? (
            <p className="text-sm text-ash">Najpierw zapisz produkt, potem dodasz zdjęcia.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {(p.images ?? []).map((img) => (
                <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded-xl border border-line">
                  <img src={img.url} className="h-full w-full object-cover" />
                  <button onClick={() => removeImage(img.id)} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/70 text-white">
                    <Icon name="close" size={13} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                className="grid h-24 w-24 place-items-center rounded-xl border border-dashed border-line text-sm text-ash active:bg-cream"
              >
                + Dodaj
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
            </div>
          )}
        </div>

        {err && <ErrorNote msg={err} />}
      </div>
    </Sheet>
  );
}
