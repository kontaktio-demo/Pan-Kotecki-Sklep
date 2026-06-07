import { supabase } from "./supabase.js";
import { zloty } from "./util.js";

// Wysyłka maili przez Resend (HTTP API). Ten sam klucz `re_...`, którego użyłeś
// w Supabase SMTP, ustaw na backendzie jako RESEND_API_KEY. Bez klucza = no-op
// (logujemy i nie blokujemy procesu).
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "Pan Kotecki <kontakt@pankotecki.pl>";
const OWNER = process.env.CONTACT_NOTIFY_EMAIL || "biuro@pankotecki.pl";
// Kod powitalny z newslettera — utwórz taką promocję (10%) w panelu.
const WELCOME_CODE = process.env.NEWSLETTER_WELCOME_CODE || "KOT10";

export async function sendEmail(opts: { to: string; subject: string; html: string; replyTo?: string }): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY nie ustawiony — pomijam wysyłkę:", opts.subject);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) console.error("[email] resend", res.status, await res.text().catch(() => ""));
  } catch (e) {
    console.error("[email] send", e);
  }
}

// ── Szablon bazowy (branding Pan Kotecki) ────────────────────
function shell(title: string, inner: string, footerExtra = ""): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4ec;padding:32px 0;font-family:Arial,Helvetica,sans-serif">
  <tr><td align="center">
    <table width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e8e0d2;border-radius:20px;overflow:hidden">
      <tr><td style="padding:30px 34px 6px">
        <div style="font-size:22px;font-weight:700;color:#1d1810">Pan Kotecki<span style="color:#ef7a30">.</span> 🐾</div>
      </td></tr>
      <tr><td style="padding:6px 34px 0">
        ${title ? `<h1 style="margin:6px 0 4px;font-size:23px;color:#1d1810">${title}</h1>` : ""}
        ${inner}
      </td></tr>
      <tr><td style="padding:26px 34px 30px">
        <hr style="border:none;border-top:1px solid #e8e0d2;margin:0 0 14px">
        ${footerExtra}
        <p style="margin:0;font-size:12px;color:#bcb3a4">Pan Kotecki — sklep dla kotów i ich ludzi · pankotecki.pl</p>
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

// Wysyłka masowa (Resend batch, do 100 na żądanie). Zwraca liczbę wysłanych.
type BatchMsg = { to: string; subject: string; html: string };
export async function sendBatch(messages: BatchMsg[]): Promise<number> {
  if (!RESEND_API_KEY || messages.length === 0) return 0;
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100).map((m) => ({ from: FROM, to: [m.to], subject: m.subject, html: m.html }));
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(chunk),
      });
      if (res.ok) sent += chunk.length;
      else console.error("[email.batch]", res.status, await res.text().catch(() => ""));
    } catch (e) {
      console.error("[email.batch]", e);
    }
  }
  return sent;
}

// HTML newslettera: treść od operatora (już jako HTML) + obowiązkowa stopka „wypisz się".
export function newsletterHtml(contentHtml: string, unsubUrl: string): string {
  const footer = `<p style="margin:0 0 10px;font-size:12px;color:#bcb3a4">Otrzymujesz tę wiadomość, bo zapisałeś/aś się do newslettera Pana Koteckiego. <a href="${unsubUrl}" style="color:#bcb3a4">Wypisz się</a>.</p>`;
  return shell("", contentHtml, footer);
}

const p = (t: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3c352b">${t}</p>`;

const SHIPPING_LABEL: Record<string, string> = {
  inpost_locker: "Paczkomat InPost",
  inpost_courier: "Kurier InPost",
  pickup: "Odbiór osobisty",
};

// ── Potwierdzenie zamówienia (po opłaceniu) ──────────────────
export async function sendOrderConfirmation(orderId: string): Promise<void> {
  const { data: o } = await supabase
    .from("orders")
    .select("number, email, total_grosze, shipping_method, parcel_locker")
    .eq("id", orderId)
    .maybeSingle();
  if (!o?.email) return;
  const { data: items } = await supabase.from("order_items").select("name, qty, price_grosze").eq("order_id", orderId);

  const rows = (items ?? [])
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;font-size:14px;color:#1d1810">${i.qty}× ${i.name}</td>
         <td align="right" style="padding:6px 0;font-size:14px;color:#1d1810">${zloty(i.price_grosze * i.qty)}</td></tr>`,
    )
    .join("");

  const inner =
    p("Dziękujemy! Twoja płatność została potwierdzona — pakujemy zamówienie z miłością i pod czujnym okiem kota.") +
    `<table width="100%" style="margin:8px 0 4px;border-collapse:collapse">
      ${rows}
      <tr><td style="padding:12px 0 0;border-top:1px solid #e8e0d2;font-weight:700;color:#1d1810">Razem</td>
          <td align="right" style="padding:12px 0 0;border-top:1px solid #e8e0d2;font-weight:700;color:#1d1810">${zloty(o.total_grosze)}</td></tr>
    </table>` +
    p(
      `<strong>Numer zamówienia:</strong> ${o.number}<br><strong>Dostawa:</strong> ${
        SHIPPING_LABEL[o.shipping_method ?? ""] ?? o.shipping_method ?? "—"
      }${o.parcel_locker ? ` (${o.parcel_locker})` : ""}`,
    ) +
    p(`<a href="https://pankotecki.pl/konto/zamowienia" style="color:#ee5340;font-weight:700;text-decoration:none">Zobacz w „Moim koncie" →</a>`);

  await sendEmail({ to: o.email, subject: `Potwierdzenie zamówienia ${o.number} — Pan Kotecki`, html: shell("Dziękujemy za zamówienie! 🐾", inner) });
}

// ── Newsletter: potwierdzenie zapisu (double opt-in) ─────────
export async function sendNewsletterConfirm(email: string, confirmUrl: string): Promise<void> {
  const inner =
    p("Cześć! Potwierdź zapis do newslettera Pana Koteckiego — po kliknięciu odbierzesz kod na pierwsze zakupy.") +
    `<a href="${confirmUrl}" style="display:inline-block;background:#ff6b5c;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:12px;margin:4px 0 16px">Potwierdzam zapis 🐾</a>` +
    p(`<span style="font-size:13px;color:#7c7264">Jeśli to nie Ty — zignoruj tę wiadomość, nic się nie stanie.</span>`);
  await sendEmail({ to: email, subject: "Potwierdź zapis do newslettera — Pan Kotecki", html: shell("Jeszcze jeden krok", inner) });
}

export function welcomeCodeHtml(): string {
  return shell(
    "Zapisano! 🐾",
    p("Dziękujemy za potwierdzenie. Oto Twój kod na pierwsze zakupy:") +
      `<div style="display:inline-block;border:2px dashed #ef7a30;border-radius:12px;padding:12px 22px;font-size:22px;font-weight:800;letter-spacing:2px;color:#1d1810;margin:2px 0 16px">${WELCOME_CODE}</div>` +
      p(`<a href="https://pankotecki.pl/sklep" style="color:#ee5340;font-weight:700;text-decoration:none">Przejdź do sklepu →</a>`),
  );
}

// ── Powiadomienie właściciela o wiadomości z kontaktu ────────
export async function notifyOwnerContact(msg: { name?: string | null; email: string; subject?: string | null; message: string }): Promise<void> {
  const inner =
    p(`<strong>Od:</strong> ${msg.name ? `${msg.name} · ` : ""}${msg.email}`) +
    (msg.subject ? p(`<strong>Temat:</strong> ${msg.subject}`) : "") +
    p(msg.message.replace(/</g, "&lt;").replace(/\n/g, "<br>"));
  await sendEmail({ to: OWNER, replyTo: msg.email, subject: `Nowa wiadomość ze sklepu${msg.subject ? `: ${msg.subject}` : ""}`, html: shell("Wiadomość z formularza kontaktu", inner) });
}
