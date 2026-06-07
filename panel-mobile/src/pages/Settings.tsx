import { useEffect, useState } from "react";
import { api } from "../api";
import { fromGrosze, toGrosze } from "../format";
import { Spinner, ErrorNote } from "../ui";

export default function Settings() {
  const [freeZl, setFreeZl] = useState("149");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .get("/api/admin/settings")
      .then((s) => {
        if (s.store?.free_shipping_grosze != null) setFreeZl(fromGrosze(s.store.free_shipping_grosze));
        if (s.contact?.email) setEmail(s.contact.email);
        if (s.contact?.phone) setPhone(s.contact.phone);
        setLoaded(true);
      })
      .catch((e) => setErr(e.message));
  }, []);

  async function save() {
    setErr("");
    setSavedMsg("");
    setSaving(true);
    try {
      await api.put("/api/admin/settings/store", { value: { free_shipping_grosze: toGrosze(freeZl), currency: "PLN" } });
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
        {saving ? "Zapisuję…" : "Zapisz ustawienia"}
      </button>
      {savedMsg && <p className="text-center text-sm text-emerald-600">{savedMsg}</p>}
    </div>
  );
}
