import type { PanelConfig } from "./global";

let cfg: PanelConfig = {};

export function setCfg(c: PanelConfig) {
  cfg = c;
}
export function getCfg(): PanelConfig {
  return cfg;
}

function base(): string {
  return (cfg.apiUrl ?? "").replace(/\/$/, "");
}
function jsonHeaders(): Record<string, string> {
  return { "x-admin-key": cfg.key ?? "", "Content-Type": "application/json" };
}

async function handle(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Błąd ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path: string) => fetch(base() + path, { headers: { "x-admin-key": cfg.key ?? "" } }).then(handle),
  post: (path: string, body: unknown) =>
    fetch(base() + path, { method: "POST", headers: jsonHeaders(), body: JSON.stringify(body) }).then(handle),
  patch: (path: string, body: unknown) =>
    fetch(base() + path, { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(body) }).then(handle),
  put: (path: string, body: unknown) =>
    fetch(base() + path, { method: "PUT", headers: jsonHeaders(), body: JSON.stringify(body) }).then(handle),
  del: (path: string) =>
    fetch(base() + path, { method: "DELETE", headers: { "x-admin-key": cfg.key ?? "" } }).then(handle),
  upload: (path: string, file: File, fields?: Record<string, string>) => {
    const fd = new FormData();
    fd.append("file", file);
    if (fields) for (const k of Object.keys(fields)) fd.append(k, fields[k]);
    return fetch(base() + path, { method: "POST", headers: { "x-admin-key": cfg.key ?? "" }, body: fd }).then(handle);
  },
  getBlob: async (path: string): Promise<Blob> => {
    const res = await fetch(base() + path, { headers: { "x-admin-key": cfg.key ?? "" } });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || `Błąd ${res.status}`);
    }
    return res.blob();
  },
};

// sprawdza połączenie + klucz (ekran logowania)
export async function testConnection(apiUrl: string, key: string): Promise<boolean> {
  try {
    const res = await fetch(apiUrl.replace(/\/$/, "") + "/api/admin/me", { headers: { "x-admin-key": key } });
    return res.ok;
  } catch {
    return false;
  }
}
