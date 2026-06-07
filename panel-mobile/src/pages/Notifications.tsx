import { useState } from "react";
import { enablePush, pushPermission, pushSupported, sendTestPush } from "../push";
import Icon from "../icons";

export default function Notifications() {
  const [perm, setPerm] = useState(pushPermission());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const standalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);

  async function enable() {
    setBusy(true);
    setMsg("");
    const r = await enablePush();
    setMsg(r.message);
    setPerm(pushPermission());
    setBusy(false);
  }

  async function test() {
    setBusy(true);
    setMsg("");
    const r = await sendTestPush();
    setMsg(r.message);
    setBusy(false);
  }

  const granted = perm === "granted";

  return (
    <div className="space-y-4 p-4 pb-8">
      <div className="card p-5 text-center">
        <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-orange to-coral text-white">
          <Icon name="bell" size={30} />
        </div>
        <div className="text-lg font-bold">Powiadomienia o zakupach</div>
        <p className="mx-auto mt-1 max-w-xs text-sm text-ash">
          Dzwonek na telefon przy każdym <b>opłaconym</b> zamówieniu - nawet gdy apka jest zamknięta.
        </p>
      </div>

      {!pushSupported() && (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Najpierw zainstaluj apkę na ekranie głównym (iPhone: <b>Udostępnij → Do ekranu głównego</b>), potem otwórz z ikony.
        </div>
      )}
      {pushSupported() && !standalone && (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Na iPhonie powiadomienia działają, gdy apka jest dodana do ekranu głównego i otwarta z ikony.
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Status</div>
            <div className="text-sm text-ash">
              {granted ? "Włączone ✓" : perm === "denied" ? "Zablokowane w ustawieniach iPhone" : "Wyłączone"}
            </div>
          </div>
          <span className={`statuspill ${granted ? "bg-emerald-100 text-emerald-700" : "bg-cream text-ash"}`}>
            {granted ? "ON" : "OFF"}
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <button className="btn-orange w-full" onClick={enable} disabled={busy}>
            {busy ? "Chwilka..." : granted ? "Odśwież subskrypcję" : "Włącz powiadomienia"}
          </button>
          {granted && (
            <button className="btn-ghost w-full" onClick={test} disabled={busy}>
              Wyślij testowe 🔔
            </button>
          )}
        </div>
        {msg && <p className="mt-3 text-sm text-ink">{msg}</p>}
        {perm === "denied" && (
          <p className="mt-2 text-xs text-ash">
            Jeśli zablokowane: iPhone → Ustawienia → przewiń do „Pan Kotecki” → Powiadomienia → włącz.
          </p>
        )}
      </div>
    </div>
  );
}
