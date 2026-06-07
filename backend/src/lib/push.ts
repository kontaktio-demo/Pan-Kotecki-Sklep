import webpush from "web-push";
import { supabase } from "./supabase.js";

// Powiadomienia push (Web Push / VAPID). Działają tylko, gdy ustawione są klucze.
const PUBLIC = process.env.VAPID_PUBLIC_KEY ?? "";
const PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:biuro@pankotecki.pl";

export const pushEnabled = Boolean(PUBLIC && PRIVATE);
if (pushEnabled) {
  try {
    webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
  } catch (e) {
    console.error("[push] błędne klucze VAPID", e);
  }
}

export function vapidPublicKey(): string | null {
  return pushEnabled ? PUBLIC : null;
}

type PushPayload = { title: string; body: string; url?: string; tag?: string };

// Wysyła powiadomienie do wszystkich zapisanych urządzeń (telefonów właścicieli).
// Martwe subskrypcje (404/410) automatycznie usuwa - to dba o niezawodność.
export async function sendPushToAll(payload: PushPayload): Promise<void> {
  if (!pushEnabled) return;
  const { data: subs, error } = await supabase.from("push_subscriptions").select("id, subscription");
  if (error || !subs?.length) return;

  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription as webpush.PushSubscription, body);
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        // 401/403 = subskrypcja niezgodna z aktualnymi kluczami VAPID; 404/410 = wygasła.
        if (code && [401, 403, 404, 410].includes(code)) {
          await supabase.from("push_subscriptions").delete().eq("id", row.id);
        } else {
          console.error("[push] wysyłka nieudana", code);
        }
      }
    }),
  );
}
