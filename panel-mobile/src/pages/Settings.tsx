import { useEffect, useState } from "react";
import { api } from "../api";
import { fromGrosze, toGrosze } from "../format";
import { Spinner, ErrorNote } from "../ui";

export default function Settings() {
  const [open, setOpen] = useState(true);
  const [freeZl, setFreeZl] = useState("149");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .get("/api/admin/settings")
      .then((s) => {
        setOpen(s.store?.open !== false); // domyślnie otwarty
        if (s.store?.free_shipping_grosze != null) setFreeZl(fromGrosze(s.store.free_shipping_grosze));
        if (s.contact?.email) setEmail(s.contact.email);
        if (s.contact?.phone) setPhone(s.contact.phone);
        setLoaded(true);
      })
      .catch((e) => setErr(e.message));
  }, []);

  // zapis CAŁEGO obiektu store (open + próg) - żeby nic się nie nadpisało
  function storeValue(nextOpen: boolean) {
    return { free_shipping_grosze: toGrosze(freeZl), currency: "PLN", open: nextOpen };
  }

  async function toggleStore() {
    setToggling(true);
    setErr("");
    const next = !open;
    try {
      await api.put("/api/admin/settings/store", { value: storeValue(next) });
      setOpen(next);
    } catch (e) {
      setErr((e as Error).message);
    }
    setToggling(false);
  }

  async function save() {
    setErr("");
    setSavedMsg("");
    setSaving(true);
    try {
      await api.put("/api/admin/settings/store", { value: storeValue(open) });
      await api.put("/api/admin/settings/contact", { value: { email, phone } });
      setSavedMsg("Zapisano ✓");
      setTimeout(() => setSavedMsg(""), 2000);
    } catch (e) {
      setErr((e as Error).message);
    }
    setSaving(false);
  }

  if (!loaded && !err) return <Spinner />;

  return (
    <div className="space-y-4 p-4 pb-8">
      {err && <ErrorNote msg={err} />}

      {/* Włącznik sklepu */}
      <div className={`card p-5 ${open ? "" : "border-amber-300 bg-amber-50"}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold">{open ? "Sklep otwarty 🟢" : "Tryb „Wkrótce” 🟡"}</div>
            <div className="text-sm text-ash">
              {open ? "Klienci mogą kupować." : "Sklep ukryty - strona pokazuje „Wkrótce otwieramy”."}
            </div>
          </div>
          <button
            onClick={toggleStore}
            disabled={toggling}
            aria-label="Przełącz sklep"
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${open ? "bg-emerald-500" : "bg-line"}`}
          >
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${open ? "left-7" : "left-1"}`} />
          </button>
        </div>
        <p className="mt-3 text-xs text-ash">
          Produkty możesz dodawać przez cały czas - niezależnie od trybu. Zmiana działa na stronie w ~30 s.
        </p>
      </div>

      <div className="card space-y-4 p-5">
        <div>
          <label className="label">Darmowa dostawa od (zł)</label>
          <input className="input" inputMode="decimal" value={freeZl} onChange={(e) => setFreeZl(e.target.value)} />
          <p className="mt-1 text-xs text-ash">Powyżej tej kwoty dostawa kurierem/paczkomatem jest gratis.</p>
        </div>
        <div>
          <label className="label">E-mail kontaktowy</label>
          <input className="input" inputMode="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Telefon</label>
          <input className="input" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <button className="btn-primary w-full" onClick={save} disabled={saving}>
        {saving ? "Zapisuję..." : "Zapisz ustawienia"}
      </button>
      {savedMsg && <p className="text-center text-sm text-emerald-600">{savedMsg}</p>}
    </div>
  );
}
