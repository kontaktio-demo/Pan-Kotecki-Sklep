"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/account/AuthProvider";
import { CenterSpinner, ErrorNote } from "@/components/account/ui";
import {
  getAddresses, addAddress, updateAddress, deleteAddress,
  type AccountAddress, type AddressInput,
} from "@/lib/account";

const EMPTY: AddressInput = {
  label: "", first_name: "", last_name: "", street: "", building: "",
  apartment: "", postal_code: "", city: "", phone: "", is_default: false,
};

const inputCls = "w-full rounded-xl border border-line bg-milk px-4 py-3 text-sm outline-none transition-colors focus:border-ink";

export default function AdresyPage() {
  const { user, loading } = useAuth();
  const [list, setList] = useState<AccountAddress[] | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<AddressInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (loading || !user) return;
    getAddresses().then(setList).catch((e) => { setErr(e.message); setList([]); });
  }, [user, loading]);

  if (loading || !user || list === null) return <CenterSpinner />;

  function startNew() {
    setForm(EMPTY);
    setEditing("new");
    setErr("");
  }
  function startEdit(a: AccountAddress) {
    setForm({
      label: a.label ?? "", first_name: a.first_name, last_name: a.last_name,
      street: a.street, building: a.building, apartment: a.apartment ?? "",
      postal_code: a.postal_code, city: a.city, phone: a.phone ?? "", is_default: a.is_default,
    });
    setEditing(a.id);
    setErr("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      if (editing === "new") await addAddress(form);
      else if (editing) await updateAddress(editing, form);
      setList(await getAddresses());
      setEditing(null);
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm("Usunąć ten adres?")) return;
    try {
      await deleteAddress(id);
      setList(await getAddresses());
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  const set = (k: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === "is_default" ? e.target.checked : e.target.value }));

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold md:text-3xl">Adresy</h1>
        {editing === null && (
          <button onClick={startNew} className="tap rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-milk hover:bg-coral">
            Dodaj adres
          </button>
        )}
      </div>
      <p className="mt-2 text-ink-soft">Zapisane adresy podstawią się automatycznie w kasie.</p>

      {err && <div className="mt-5"><ErrorNote msg={err} /></div>}

      {editing !== null && (
        <form onSubmit={save} className="mt-6 rounded-2xl border border-line bg-white p-5 md:p-6">
          <p className="mb-4 font-semibold">{editing === "new" ? "Nowy adres" : "Edytuj adres"}</p>
          <div className="grid gap-3">
            <input className={inputCls} placeholder="Nazwa (np. Dom, Praca) — opcjonalnie" value={form.label ?? ""} onChange={set("label")} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input required className={inputCls} placeholder="Imię" value={form.first_name} onChange={set("first_name")} />
              <input required className={inputCls} placeholder="Nazwisko" value={form.last_name} onChange={set("last_name")} />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_0.4fr_0.4fr]">
              <input required className={inputCls} placeholder="Ulica" value={form.street} onChange={set("street")} />
              <input required className={inputCls} placeholder="Nr" value={form.building} onChange={set("building")} />
              <input className={inputCls} placeholder="m. (opc.)" value={form.apartment ?? ""} onChange={set("apartment")} />
            </div>
            <div className="grid gap-3 sm:grid-cols-[0.5fr_1fr]">
              <input required className={inputCls} placeholder="Kod pocztowy" value={form.postal_code} onChange={set("postal_code")} />
              <input required className={inputCls} placeholder="Miejscowość" value={form.city} onChange={set("city")} />
            </div>
            <input className={inputCls} placeholder="Telefon (opcjonalnie)" value={form.phone ?? ""} onChange={set("phone")} />
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
              <input type="checkbox" checked={!!form.is_default} onChange={set("is_default")} className="h-4 w-4 accent-coral" />
              Ustaw jako domyślny
            </label>
          </div>
          <div className="mt-5 flex gap-2">
            <button type="submit" disabled={busy} className="tap rounded-xl bg-coral px-6 py-3 text-sm font-semibold text-white hover:bg-coral-deep disabled:opacity-60">
              {busy ? "Zapisuję…" : "Zapisz adres"}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="tap rounded-xl border border-line px-5 py-3 text-sm font-medium hover:border-ink">
              Anuluj
            </button>
          </div>
        </form>
      )}

      {list.length === 0 && editing === null ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/60 p-10 text-center">
          <p className="font-medium">Brak zapisanych adresów</p>
          <p className="mt-1 text-sm text-ash">Dodaj adres, aby kolejne zakupy szły szybciej.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {list.map((a) => (
            <li key={a.id} className="flex flex-col rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center gap-2">
                {a.label && <span className="text-sm font-semibold">{a.label}</span>}
                {a.is_default && <span className="rounded-full bg-mint px-2 py-0.5 text-xs font-medium text-teal-deep">Domyślny</span>}
              </div>
              <p className="mt-1 text-sm">{a.first_name} {a.last_name}</p>
              <p className="text-sm text-ink-soft">
                {a.street} {a.building}{a.apartment ? `/${a.apartment}` : ""}<br />
                {a.postal_code} {a.city}
              </p>
              {a.phone && <p className="mt-1 text-sm text-ash">{a.phone}</p>}
              <div className="mt-auto flex gap-3 pt-4 text-sm">
                <button onClick={() => startEdit(a)} className="font-medium text-ink transition-colors hover:text-coral">Edytuj</button>
                <button onClick={() => remove(a.id)} className="text-ash transition-colors hover:text-coral">Usuń</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
