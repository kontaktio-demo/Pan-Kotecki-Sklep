"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/account/AuthProvider";
import { CenterSpinner, ErrorNote } from "@/components/account/ui";
import { getProfile, updateProfile, deleteAccount } from "@/lib/account";

const inputCls = "w-full rounded-xl border border-line bg-milk px-4 py-3 text-sm outline-none transition-colors focus:border-ink";

export default function DanePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    getProfile()
      .then((p) => {
        setEmail(p.email);
        setFullName(p.full_name);
        setPhone(p.phone);
        setConsent(p.marketing_consent);
        setReady(true);
      })
      .catch((e) => { setErr(e.message); setReady(true); });
  }, [user, loading]);

  if (loading || !user || !ready) return <CenterSpinner />;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setSaved(false);
    try {
      await updateProfile({ full_name: fullName, phone, marketing_consent: consent });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  }

  async function doDelete() {
    setBusy(true);
    setErr("");
    try {
      await deleteAccount();
      await signOut();
      router.replace("/");
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold md:text-3xl">Dane konta</h1>
      <p className="mt-2 text-ink-soft">Zarządzaj swoimi danymi i zgodami.</p>

      {err && <div className="mt-5"><ErrorNote msg={err} /></div>}

      <form onSubmit={save} className="mt-6 rounded-2xl border border-line bg-white p-5 md:p-6">
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ash">E-mail (login)</label>
            <input value={email} disabled className={`${inputCls} cursor-not-allowed opacity-70`} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ash">Imię i nazwisko</label>
            <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="np. Anna Kowalska" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ash">Telefon</label>
            <input className={inputCls} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="np. 600 100 200" />
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-soft">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-coral" />
            <span>Chcę dostawać newsletter z nowościami i okazjami (możesz zrezygnować w każdej chwili).</span>
          </label>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button type="submit" disabled={busy} className="tap rounded-xl bg-coral px-6 py-3 text-sm font-semibold text-white hover:bg-coral-deep disabled:opacity-60">
            {busy ? "Zapisuję..." : "Zapisz zmiany"}
          </button>
          {saved && <span className="text-sm text-teal">Zapisano ✓</span>}
        </div>
      </form>

      {/* RODO - usunięcie konta */}
      <div className="mt-8 rounded-2xl border border-red-200 bg-red-50/50 p-5 md:p-6">
        <p className="font-semibold text-red-700">Usuń konto</p>
        <p className="mt-1 text-sm text-ink-soft">
          Trwale usuwamy Twój profil i zapisane adresy. Zamówienia pozostają w naszej dokumentacji
          księgowej (wymóg prawa), ale przestają być powiązane z kontem.
        </p>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="tap mt-4 rounded-xl border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100">
            Chcę usunąć konto
          </button>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={doDelete} disabled={busy} className="tap rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
              {busy ? "Usuwam..." : "Tak, usuń konto na zawsze"}
            </button>
            <button onClick={() => setConfirmDelete(false)} className="tap rounded-xl border border-line px-5 py-2.5 text-sm font-medium hover:border-ink">
              Anuluj
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
