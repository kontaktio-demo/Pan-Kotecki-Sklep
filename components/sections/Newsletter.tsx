"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import Reveal from "@/components/ui/Reveal";
import Paw from "@/components/ui/Paw";

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const HCAPTCHA_SITEKEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const captchaRef = useRef<HCaptcha>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!consent) {
      setErr("Zaznacz zgodę, aby zapisać się do newslettera.");
      return;
    }
    setBusy(true);

    let captchaToken: string | undefined;
    if (HCAPTCHA_SITEKEY) {
      try {
        const r = await captchaRef.current?.execute({ async: true });
        captchaToken = r?.response;
      } catch {
        /* zamknięto wyzwanie */
      }
      if (!captchaToken) {
        setBusy(false);
        setErr("Weryfikacja nie powiodła się - spróbuj ponownie 🐾");
        return;
      }
    }

    try {
      if (API) {
        const res = await fetch(`${API}/api/newsletter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, consent: true, source: "home", captchaToken }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error((d as { error?: string })?.error ?? "Nie udało się zapisać.");
        }
      }
      setSent(true);
    } catch (e) {
      setErr((e as Error).message);
    }
    captchaRef.current?.resetCaptcha();
    setBusy(false);
  }

  return (
    <section className="container-edge pt-16 md:pt-24">
      <div className="relative overflow-hidden rounded-[2rem] bg-orange px-6 py-14 text-center text-ink md:px-16 md:py-20">
        <div className="paw-pattern pointer-events-none absolute inset-0 opacity-[0.06]" />
        <div className="pointer-events-none absolute -left-20 -bottom-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <Reveal className="relative">
          <p className="mb-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-ink/60">
            <Paw className="h-3.5 w-3.5" />
            Newsletter
          </p>
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight md:text-5xl">
            Trochę ciepła prosto do skrzynki
          </h2>
          <p className="mx-auto mt-4 max-w-md text-ink/80">
            Zapisz się i odbierz <span className="font-semibold">10% rabatu</span> na pierwsze
            zamówienie. Wrzucamy tylko nowości i drobne premie - obiecujemy, żadnego spamu.
          </p>

          {sent ? (
            <p className="mx-auto mt-8 max-w-md text-lg font-semibold">
              Sprawdź skrzynkę i potwierdź zapis 🐾 - kod -10% czeka zaraz po potwierdzeniu.
            </p>
          ) : (
            <form onSubmit={submit} className="mx-auto mt-8 max-w-md">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Twój e-mail"
                  className="flex-1 rounded-xl border border-ink/10 bg-white px-5 py-3.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ink/20"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="tap rounded-xl bg-ink px-7 py-3.5 text-sm font-semibold text-milk transition-colors hover:bg-night disabled:opacity-60"
                >
                  {busy ? "Zapisuję..." : "Zapisz się"}
                </button>
              </div>
              <label className="mt-3 flex cursor-pointer items-start gap-2 text-left text-xs text-ink/70">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
                />
                <span>
                  Zgadzam się na otrzymywanie newslettera (możesz zrezygnować w każdej chwili). Szczegóły w{" "}
                  <Link href="/polityka-prywatnosci" className="underline">polityce prywatności</Link>.
                  {HCAPTCHA_SITEKEY && (
                    <>
                      {" "}Formularz chroni hCaptcha (
                      <a href="https://hcaptcha.com/privacy" target="_blank" rel="noreferrer" className="underline">prywatność</a>,{" "}
                      <a href="https://hcaptcha.com/terms" target="_blank" rel="noreferrer" className="underline">warunki</a>).
                    </>
                  )}
                </span>
              </label>
              {HCAPTCHA_SITEKEY && (
                <HCaptcha ref={captchaRef} sitekey={HCAPTCHA_SITEKEY} size="invisible" theme="light" />
              )}
              {err && <p className="mt-2 text-left text-xs font-medium text-ink">{err}</p>}
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
