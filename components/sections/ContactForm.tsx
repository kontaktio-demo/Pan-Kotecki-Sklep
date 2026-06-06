"use client";

import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex h-full flex-col justify-center rounded-2xl bg-cream p-10 text-center">
        <p className="font-display text-3xl text-coral">Dziękujemy!</p>
        <p className="mt-3 text-ink-soft">Odezwiemy się najszybciej, jak to możliwe.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          required
          placeholder="Imię"
          className="rounded-xl border border-ink/15 bg-milk px-5 py-4 text-sm outline-none transition-colors focus:border-ink"
        />
        <input
          required
          type="email"
          placeholder="E-mail"
          className="rounded-xl border border-ink/15 bg-milk px-5 py-4 text-sm outline-none transition-colors focus:border-ink"
        />
      </div>
      <input
        placeholder="Temat"
        className="rounded-xl border border-ink/15 bg-milk px-5 py-4 text-sm outline-none transition-colors focus:border-ink"
      />
      <textarea
        required
        rows={5}
        placeholder="Wiadomość"
        className="resize-none rounded-xl border border-ink/15 bg-milk px-5 py-4 text-sm outline-none transition-colors focus:border-ink"
      />
      <button
        type="submit"
        className="self-start rounded-full bg-ink px-8 py-4 text-sm font-medium text-milk transition-colors duration-300 hover:bg-coral"
        data-hover
      >
        Wyślij wiadomość
      </button>
    </form>
  );
}
