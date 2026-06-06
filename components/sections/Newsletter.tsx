"use client";

import { useState } from "react";
import Reveal from "@/components/ui/Reveal";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section className="container-edge pt-16 md:pt-24">
      <Reveal className="relative overflow-hidden rounded-2xl bg-cream px-8 py-14 text-center md:px-16 md:py-20">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-ash">Newsletter</p>
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight md:text-4xl">
          Nowości i drobne premie dla kociarzy
        </h2>
        <p className="mx-auto mt-4 max-w-md text-ink-soft">
          Zapisz się i odbierz <span className="font-medium text-coral">10% rabatu</span> na pierwsze
          zamówienie. Żadnego spamu — tylko rzeczy warte uwagi.
        </p>

        {sent ? (
          <p className="mx-auto mt-8 text-lg font-medium text-coral">Dzięki! Sprawdź skrzynkę 🐾</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email.includes("@")) setSent(true);
            }}
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Twój e-mail"
              className="flex-1 rounded-lg border border-ink/15 bg-white px-5 py-3.5 text-sm outline-none transition-colors focus:border-ink"
            />
            <button
              type="submit"
              className="rounded-lg bg-ink px-7 py-3.5 text-sm font-semibold text-milk transition-colors hover:bg-coral"
            >
              Zapisz się
            </button>
          </form>
        )}
      </Reveal>
    </section>
  );
}
