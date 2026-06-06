"use client";

import { useState } from "react";
import Reveal from "@/components/ui/Reveal";
import Paw from "@/components/ui/Paw";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section className="container-edge pt-16 md:pt-24">
      <div className="overflow-hidden rounded-[2rem] bg-orange px-6 py-14 text-center text-ink md:px-16 md:py-20">
        <Reveal>
          <p className="mb-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-ink/60">
            <Paw className="h-3.5 w-3.5" />
            Newsletter
          </p>
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight md:text-5xl">
            Trochę ciepła prosto do skrzynki
          </h2>
          <p className="mx-auto mt-4 max-w-md text-ink/80">
            Zapisz się i odbierz <span className="font-semibold">10% rabatu</span> na pierwsze
            zamówienie. Wrzucamy tylko nowości i drobne premie — obiecujemy, żadnego spamu.
          </p>

          {sent ? (
            <p className="mx-auto mt-8 text-lg font-semibold">Dzięki! Sprawdź skrzynkę 🐾</p>
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
                className="flex-1 rounded-lg border border-ink/10 bg-white px-5 py-3.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ink/20"
              />
              <button
                type="submit"
                className="rounded-lg bg-ink px-7 py-3.5 text-sm font-semibold text-milk transition-colors hover:bg-night"
              >
                Zapisz się
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
