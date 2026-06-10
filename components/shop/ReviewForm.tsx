"use client";

import { useState } from "react";
import { useAuth } from "@/components/account/AuthProvider";
import { getAccessToken } from "@/lib/account";
import { submitReview } from "@/lib/reviews";
import { toast } from "@/lib/toast";

// Formularz opinii - tylko zweryfikowany zakup. Zalogowani: automatycznie po
// koncie. Goście: numer zamówienia + e-mail użyty przy zakupie.
export default function ReviewForm({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (rating === 0) {
      setErr("Wybierz ocenę (1-5 gwiazdek).");
      return;
    }
    setSending(true);
    const token = user ? await getAccessToken() : null;
    const result = await submitReview(
      slug,
      {
        rating,
        body: body.trim(),
        author_name: name.trim(),
        ...(user ? {} : { order_number: orderNumber.trim(), email: email.trim() }),
      },
      token,
    );
    setSending(false);
    if (result.ok) {
      setDone(true);
      toast("Dziękujemy za opinię!");
    } else {
      setErr(result.message);
    }
  }

  if (done) {
    return (
      <div className="mt-4 rounded-2xl border border-teal/30 bg-mint/60 p-5 text-sm text-teal-deep">
        <p className="font-semibold">Opinia wysłana 🐾</p>
        <p className="mt-1">Pojawi się tutaj po krótkiej moderacji. Dziękujemy!</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap mt-4 w-full rounded-xl bg-ink px-6 py-3.5 text-sm font-semibold text-milk transition-colors hover:bg-coral"
      >
        Napisz opinię
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4 rounded-2xl border border-line bg-white p-5">
      <div>
        <p className="mb-1.5 text-sm font-medium">Twoja ocena</p>
        <div className="flex gap-1" role="radiogroup" aria-label="Ocena produktu">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} ${star === 1 ? "gwiazdka" : "gwiazdki"}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className={`tap text-2xl transition-colors ${(hover || rating) >= star ? "text-coral" : "text-line"}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="rev-name" className="mb-1.5 block text-sm font-medium">
          Imię (i kot, jeśli chce)
        </label>
        <input
          id="rev-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={60}
          placeholder="np. Ania i Mruczek"
          className="w-full rounded-xl border border-line bg-milk px-4 py-2.5 text-sm outline-none transition-colors focus:border-ink"
        />
      </div>

      <div>
        <label htmlFor="rev-body" className="mb-1.5 block text-sm font-medium">
          Opinia
        </label>
        <textarea
          id="rev-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          placeholder="Jak sprawdził się produkt? Co na to kot?"
          className="w-full resize-y rounded-xl border border-line bg-milk px-4 py-2.5 text-sm outline-none transition-colors focus:border-ink"
        />
      </div>

      {!user && (
        <div className="space-y-3 rounded-xl bg-cream/60 p-4">
          <p className="text-xs text-ash">
            Opinie przyjmujemy tylko od kupujących. Podaj numer zamówienia (z maila z potwierdzeniem)
            i e-mail użyty przy zakupie - albo <a href="/logowanie" className="underline underline-offset-2 hover:text-ink">zaloguj się</a>.
          </p>
          <div>
            <label htmlFor="rev-order" className="mb-1.5 block text-sm font-medium">
              Numer zamówienia
            </label>
            <input
              id="rev-order"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
              maxLength={40}
              placeholder="PK-..."
              className="w-full rounded-xl border border-line bg-milk px-4 py-2.5 text-sm outline-none transition-colors focus:border-ink"
            />
          </div>
          <div>
            <label htmlFor="rev-email" className="mb-1.5 block text-sm font-medium">
              E-mail z zamówienia
            </label>
            <input
              id="rev-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={160}
              placeholder="twoj@email.pl"
              className="w-full rounded-xl border border-line bg-milk px-4 py-2.5 text-sm outline-none transition-colors focus:border-ink"
            />
          </div>
        </div>
      )}

      {err && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={sending}
          className="tap flex-1 rounded-xl bg-coral px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-coral/20 transition-colors hover:bg-coral-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Wysyłam..." : "Wyślij opinię"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="tap rounded-xl border border-ink/20 px-5 py-3 text-sm font-medium transition-colors hover:border-ink"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}
