"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { CenterSpinner } from "./ui";
import Paw from "@/components/ui/Paw";

const NAV = [
  { href: "/konto", label: "Przegląd", exact: true },
  { href: "/konto/zamowienia", label: "Zamówienia" },
  { href: "/konto/adresy", label: "Adresy" },
  { href: "/konto/dane", label: "Dane konta" },
];

export default function AccountShell({ children }: { children: React.ReactNode }) {
  const { user, loading, configured, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) return <CenterSpinner />;

  // Niezalogowany albo konta wyłączone → zaproszenie do logowania (bez nacisku).
  if (!configured || !user) {
    return (
      <div className="container-edge flex flex-col items-center py-20 text-center md:py-28">
        <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-peach text-orange-deep shadow-sm">
          <Paw className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-semibold md:text-3xl">Zaloguj się do konta</h1>
        <p className="mt-3 max-w-md text-ink-soft">
          Tutaj zobaczysz swoje zamówienia i zapisane adresy. Konto jest opcjonalne - kupować możesz też jako gość.
        </p>
        <Link
          href="/logowanie"
          className="tap mt-7 rounded-xl bg-coral px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-coral/20 hover:bg-coral-deep"
        >
          Przejdź do logowania
        </Link>
      </div>
    );
  }

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <div className="container-edge grid gap-8 py-10 md:py-12 lg:grid-cols-[240px_1fr] lg:gap-12">
      <aside>
        <p className="text-xs uppercase tracking-[0.18em] text-ash">Moje konto</p>
        <p className="mt-1 truncate text-sm font-medium" title={user.email ?? ""}>{user.email}</p>

        <nav className="mt-5 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`tap shrink-0 rounded-xl px-4 py-2.5 text-sm transition-colors lg:px-3 ${
                isActive(n.href, n.exact) ? "bg-ink text-milk" : "text-ink-soft hover:bg-cream"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="tap shrink-0 rounded-xl px-4 py-2.5 text-left text-sm text-ash transition-colors hover:text-ink lg:px-3"
          >
            Wyloguj
          </button>
        </nav>
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
