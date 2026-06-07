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
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      }));
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
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await api.post("/api/admin/push/subscribe", existing.toJSON());
      return;
    }
    const { key } = await api.get("/api/admin/push/public-key");
    if (!key) return;
    const fresh = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
    await api.post("/api/admin/push/subscribe", fresh.toJSON());
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
