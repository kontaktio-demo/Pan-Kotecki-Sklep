"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";
import Paw from "@/components/ui/Paw";

export default function LoginForm() {
  const router = useRouter();
  const { user, loading, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Zalogowany? Od razu do panelu.
  useEffect(() => {
    if (!loading && user) router.replace("/konto");
  }, [user, loading, router]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setErr("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/konto`,
        shouldCreateUser: true,
      },
    });
    setBusy(false);
    if (error) setErr("Nie udało się wysłać linku. Sprawdź adres e-mail i spróbuj ponownie.");
    else setSent(true);
  }

  return (
    <div className="container-edge flex justify-center py-16 md:py-24">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-peach text-orange-deep shadow-sm">
            <Paw className="h-7 w-7" />
          </span>
          <h1 className="text-3xl font-semibold md:text-4xl">Twoje konto</h1>
          <p className="mt-2 max-w-sm text-ink-soft">
            Logowanie bez hasła — podaj e-mail, wyślemy Ci link. Konto jest opcjonalne:
            zakupy zrobisz też jako gość.
          </p>
        </div>

        {!configured ? (
          <div className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-ink-soft">
            Konta klientów będą dostępne już niebawem. Na razie spokojnie kupujesz jako gość 🐾
          </div>
        ) : sent ? (
          <div className="rounded-2xl border border-line bg-white p-7 text-center">
            <p className="text-lg font-semibold">Sprawdź skrzynkę 🐾</p>
            <p className="mt-2 text-sm text-ink-soft">
              Wysłaliśmy link do logowania na <span className="font-medium text-ink">{email}</span>.
              Kliknij go na tym urządzeniu, aby się zalogować.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-5 text-sm font-medium text-coral transition-colors hover:text-coral-deep"
            >
              Podaj inny adres
            </button>
          </div>
        ) : (
          <form onSubmit={send} className="rounded-2xl border border-line bg-white p-7">
            <label className="mb-1.5 block text-xs font-medium text-ash">Adres e-mail</label>
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kot@example.com"
              className="w-full rounded-xl border border-line bg-milk px-4 py-3.5 text-sm outline-none transition-colors focus:border-ink"
            />
            {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
            <button
              type="submit"
              disabled={busy}
              className="tap mt-4 w-full rounded-xl bg-coral px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-coral/20 hover:bg-coral-deep disabled:opacity-60"
            >
              {busy ? "Wysyłam link…" : "Wyślij link do logowania"}
            </button>
            <p className="mt-4 text-center text-xs text-mist">
              Logując się, akceptujesz{" "}
              <Link href="/regulamin" className="underline hover:text-ink">regulamin</Link> i{" "}
              <Link href="/polityka-prywatnosci" className="underline hover:text-ink">politykę prywatności</Link>.
            </p>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ash">
          Wolisz bez konta?{" "}
          <Link href="/sklep" className="font-medium text-ink underline-offset-2 hover:underline">
            Kupuj jako gość
          </Link>
        </p>
      </div>
    </div>
  );
}
