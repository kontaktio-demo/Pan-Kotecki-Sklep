import { api } from "./api";

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function pushPermission(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

// Czy istniejąca subskrypcja pasuje do aktualnego klucza VAPID (po rotacji — nie).
function sameKey(sub: PushSubscription, keyB64: string): boolean {
  try {
    const cur = urlBase64ToUint8Array(keyB64);
    const existing = sub.options?.applicationServerKey;
    if (!existing) return false;
    const ex = new Uint8Array(existing as ArrayBuffer);
    if (ex.length !== cur.length) return false;
    for (let i = 0; i < ex.length; i++) if (ex[i] !== cur[i]) return false;
    return true;
  } catch {
    return false;
  }
}

async function subscribeFresh(reg: ServiceWorkerRegistration, keyB64: string) {
  let sub = await reg.pushManager.getSubscription();
  if (sub && !sameKey(sub, keyB64)) {
    await sub.unsubscribe(); // klucz VAPID się zmienił → subskrybuj od nowa
    sub = null;
  }
  return sub ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(keyB64) }));
}

// Wyrejestruj powiadomienia (przy zmianie połączenia).
export async function unsubscribePush(): Promise<void> {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
  } catch {
    /* ignore */
  }
}

// Włącza (lub odnawia) powiadomienia push i wysyła subskrypcję na backend.
export async function enablePush(): Promise<{ ok: boolean; message: string }> {
  if (!pushSupported()) {
    return {
      ok: false,
      message:
        "Powiadomienia działają po zainstalowaniu apki na ekranie głównym. iPhone: Udostępnij → „Do ekranu głównego”, potem otwórz z ikony.",
    };
  }
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, message: "Nie wyrażono zgody na powiadomienia." };
  try {
    const reg = await navigator.serviceWorker.ready;
    const { key } = await api.get("/api/admin/push/public-key");
    if (!key) return { ok: false, message: "Serwer nie ma skonfigurowanych powiadomień (brak kluczy VAPID na Render)." };
    const sub = await subscribeFresh(reg, key);
    await api.post("/api/admin/push/subscribe", sub.toJSON());
    return { ok: true, message: "Powiadomienia włączone ✓ Zadzwoni przy każdym opłaconym zamówieniu." };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

// Cicha próba odnowienia subskrypcji przy starcie — zwiększa niezawodność.
export async function refreshPushSilently(): Promise<void> {
  if (!pushSupported() || Notification.permission !== "granted") return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const { key } = await api.get("/api/admin/push/public-key");
    if (!key) return;
    const sub = await subscribeFresh(reg, key); // odnawia, jeśli klucz VAPID się zmienił
    await api.post("/api/admin/push/subscribe", sub.toJSON());
  } catch {
    /* cicho — spróbujemy następnym razem */
  }
}

// Wyślij testowe powiadomienie (z Ustawień).
export async function sendTestPush(): Promise<{ ok: boolean; message: string }> {
  try {
    await api.post("/api/admin/push/test", {});
    return { ok: true, message: "Wysłano testowe powiadomienie 🔔" };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
