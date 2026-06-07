import { useState } from "react";
import { saveConfig } from "../config";
import { testConnection } from "../api";
import type { PanelConfig } from "../global";

export default function Setup({ onDone }: { onDone: (c: PanelConfig) => void }) {
  const [apiUrl, setApiUrl] = useState("");
  const [key, setKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState("");

  async function connect() {
    const url = apiUrl.trim().replace(/\/+$/, "");
    const k = key.trim();
    if (!url || !k) {
      setMsg("Podaj adres API i klucz.");
      return;
    }
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      setMsg("Adres API jest nieprawidłowy (np. https://twoj-backend.onrender.com).");
      return;
    }
    const local = ["localhost", "127.0.0.1"].includes(parsed.hostname);
    if (parsed.protocol !== "https:" && !local) {
      setMsg("Użyj adresu https:// - klucz nie może iść przez niezabezpieczone http.");
      return;
    }
    setTesting(true);
    setMsg("");
    const ok = await testConnection(url, k);
    setTesting(false);
    if (!ok) {
      setMsg("Nie udało się połączyć. Sprawdź adres i klucz (oraz czy backend działa).");
      return;
    }
    const cfg = { apiUrl: url, key: k };
    saveConfig(cfg);
    onDone(cfg);
  }

  return (
    <div className="safe-top safe-bottom flex h-full flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-orange to-coral text-3xl shadow-lg shadow-orange/30">
            🐾
          </div>
          <div className="text-2xl font-bold">
            Pan Kotecki<span className="text-orange">.</span>
          </div>
          <p className="mt-1 text-sm text-ash">Panel sklepu. Łączysz się raz.</p>
        </div>

        <label className="label">Adres API (z Render)</label>
        <input
          className="input mb-4"
          placeholder="https://twoj-backend.onrender.com"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />

        <label className="label">Klucz panelu (ADMIN_API_KEY)</label>
        <input
          className="input mb-5"
          type="password"
          placeholder="••••••••••••"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && connect()}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />

        {msg && <p className="mb-4 text-sm text-red-600">{msg}</p>}

        <button className="btn-primary w-full py-3.5" onClick={connect} disabled={testing}>
          {testing ? "Łączę..." : "Połącz"}
        </button>
      </div>
    </div>
  );
}
