/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

// Service worker panelu - jego głównym zadaniem są powiadomienia push.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Nowe zamówienie → powiadomienie na ekranie telefonu.
self.addEventListener("push", (event) => {
  let payload: { title?: string; body?: string; url?: string; tag?: string } = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "Pan Kotecki";
  const options: NotificationOptions = {
    body: payload.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: payload.url || "/" },
    tag: payload.tag,
    // @ts-expect-error - pole wspierane na części platform
    vibrate: [80, 40, 80],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Kliknięcie w powiadomienie → otwórz/wróć do panelu (zakładka Zamówienia).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  const nav = url.includes("orders") ? "orders" : "home";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          const wc = client as WindowClient;
          // okno już otwarte: powiadom apkę, żeby przełączyła zakładkę (sama zmiana #hash nie wystarcza)
          wc.postMessage?.({ nav });
          return wc.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
