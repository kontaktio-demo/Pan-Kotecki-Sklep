"use client";

import { useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const inputCls =
  "rounded-xl border border-ink/15 bg-milk px-5 py-4 text-sm outline-none transition-colors focus:border-ink";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (sent) {
    return (
      <div className="flex h-full flex-col justify-center rounded-2xl bg-cream p-10 text-center">
        <p className="font-display text-3xl text-coral">Dziękujemy!</p>
        <p className="mt-3 text-ink-soft">Odezwiemy się najszybciej, jak to możliwe. 🐾</p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (API) {
        const res = await fetch(`${API}/api/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, subject, message }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error((d as { error?: string })?.error ?? "Nie udało się wysłać wiadomości.");
        }
      }
      setSent(true);
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input required placeholder="Imię" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        <input required type="email" placeholder="E-mail" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <input placeholder="Temat" className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} />
      <textarea
        required
        rows={5}
        placeholder="Wiadomość"
        className={`resize-none ${inputCls}`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button
        type="submit"
        disabled={busy}
        className="tap self-start rounded-full bg-ink px-8 py-4 text-sm font-medium text-milk transition-colors duration-300 hover:bg-coral disabled:opacity-60"
      >
        {busy ? "Wysyłam…" : "Wyślij wiadomość"}
      </button>
      <p className="text-xs text-mist">
        Wysyłając wiadomość, zgadzasz się na przetwarzanie Twoich danych w celu udzielenia odpowiedzi — szczegóły w{" "}
        <Link href="/polityka-prywatnosci" className="underline hover:text-ink">polityce prywatności</Link>.
      </p>
    </form>
  );
}
