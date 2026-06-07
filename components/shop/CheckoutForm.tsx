"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, cartTotal } from "@/store/cart";
import { formatPrice, FREE_SHIPPING_FROM } from "@/lib/format";
import ProductMedia from "./ProductMedia";
import LockerPicker from "./LockerPicker";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/account/AuthProvider";
import { getAccessToken, getProfile, getAddresses, addAddress, type AccountAddress } from "@/lib/account";

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

const DELIVERY = [
  { id: "paczkomat", label: "Paczkomat InPost 24/7", sub: "1–2 dni robocze", cost: 11.99, method: "inpost_locker" },
  { id: "kurier", label: "Kurier InPost", sub: "1–2 dni robocze", cost: 14.99, method: "inpost_courier" },
] as const;

const inputCls =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink";

export default function CheckoutForm() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const subtotal = cartTotal(items);

  const [delivery, setDelivery] = useState<(typeof DELIVERY)[number]["id"]>("paczkomat");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [street, setStreet] = useState("");
  const [building, setBuilding] = useState("");
  const [postal, setPostal] = useState("");
  const [city, setCity] = useState("");
  const [locker, setLocker] = useState("");
  const [lockerLabel, setLockerLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [canceled, setCanceled] = useState(false);
  const [freeFrom, setFreeFrom] = useState(FREE_SHIPPING_FROM);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0); // zł
  const [promoOk, setPromoOk] = useState(false);
  const [promoMsg, setPromoMsg] = useState("");
  const [accept, setAccept] = useState(false);

  // Konto (opcjonalne): prefill danych i zapisanych adresów dla zalogowanych.
  const { user, configured } = useAuth();
  const [addresses, setAddresses] = useState<AccountAddress[]>([]);
  const [activeAddr, setActiveAddr] = useState<string | null>(null);
  const [saveAddr, setSaveAddr] = useState(false);

  function applyAddress(a: AccountAddress) {
    setFirstName(a.first_name);
    setLastName(a.last_name);
    setStreet(a.street);
    setBuilding(a.building);
    setPostal(a.postal_code);
    setCity(a.city);
    if (a.phone) setPhone(a.phone);
    setActiveAddr(a.id);
  }

  useEffect(() => {
    if (!user) return;
    getProfile()
      .then((p) => {
        setEmail((e) => e || p.email || "");
        if (p.full_name) {
          const parts = p.full_name.split(" ");
          setFirstName((v) => v || parts[0] || "");
          setLastName((v) => v || parts.slice(1).join(" "));
        }
        setPhone((v) => v || p.phone || "");
      })
      .catch(() => {});
    getAddresses()
      .then((list) => {
        setAddresses(list);
        const def = list.find((a) => a.is_default) ?? list[0];
        if (def) applyAddress(def);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("anulowano") === "1") setCanceled(true);
    } catch {}
    if (API) {
      fetch(`${API}/api/settings/public`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.freeShippingGrosze != null) setFreeFrom(d.freeShippingGrosze / 100);
        })
        .catch(() => {});
    }
  }, []);

  async function applyPromo() {
    const code = promoCode.trim().toUpperCase();
    setPromoMsg("");
    if (!code) return;
    if (!API) {
      setPromoMsg("Kody rabatowe działają po podłączeniu sklepu do API.");
      return;
    }
    try {
      const res = await fetch(`${API}/api/promo/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal_grosze: Math.round(subtotal * 100) }),
      });
      const d = await res.json().catch(() => ({}));
      if (d?.valid) {
        setPromoDiscount((d.discountGrosze ?? 0) / 100);
        setPromoOk(true);
        setPromoMsg(`Kod zastosowany — rabat ${formatPrice((d.discountGrosze ?? 0) / 100)} 🐾`);
      } else {
        setPromoDiscount(0);
        setPromoOk(false);
        setPromoMsg(d?.message ?? "Kod nieprawidłowy.");
      }
    } catch {
      setPromoMsg("Nie udało się sprawdzić kodu.");
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-edge flex flex-col items-center gap-5 py-20 text-center">
        <p className="text-2xl font-semibold">Koszyk jest pusty</p>
        <p className="max-w-md text-ink-soft">Dodaj produkty, aby złożyć zamówienie.</p>
        <Button href="/sklep" arrow>
          Przejdź do sklepu
        </Button>
      </div>
    );
  }

  const selected = DELIVERY.find((d) => d.id === delivery)!;
  const freeShipping = subtotal >= freeFrom;
  const deliveryCost = freeShipping ? 0 : selected.cost;
  const discount = promoOk ? Math.min(promoDiscount, subtotal) : 0;
  const total = Math.max(0, subtotal + deliveryCost - discount);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (selected.method === "inpost_locker" && !locker) {
      setError("Wybierz paczkomat (podaj kod, np. LOD01M).");
      return;
    }

    const payload = {
      items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
      email: email.trim(),
      phone: phone.trim(),
      name: `${firstName} ${lastName}`.trim(),
      shipping_method: selected.method,
      shipping_address: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        ...(selected.method === "inpost_courier"
          ? { street: street.trim(), building_number: building.trim(), city: city.trim(), post_code: postal.trim() }
          : {}),
      },
      ...(selected.method === "inpost_locker" ? { parcel_locker: locker } : {}),
      ...(promoOk && promoCode.trim() ? { promo_code: promoCode.trim().toUpperCase() } : {}),
    };

    // Tryb demo (lokalnie bez backendu) — zachowanie poglądowe.
    if (!API) {
      const nr = `KOT-${String(Date.now()).slice(-6)}`;
      try {
        sessionStorage.setItem("kotecki-order", JSON.stringify({ nr, total }));
      } catch {}
      clear();
      router.push(`/kasa/dziekujemy?order=${nr}`);
      return;
    }

    setLoading(true);

    // Zalogowany? Doklej token (zamówienie trafi na konto) i ewentualnie zapisz adres.
    const token = user ? await getAccessToken() : null;
    if (token && saveAddr && selected.method === "inpost_courier") {
      try {
        await addAddress({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          street: street.trim(),
          building: building.trim(),
          postal_code: postal.trim(),
          city: city.trim(),
          phone: phone.trim() || undefined,
        });
      } catch {}
    }

    try {
      const res = await fetch(`${API}/api/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Nie udało się złożyć zamówienia. Sprawdź dane i spróbuj ponownie.");
        setLoading(false);
        return;
      }
      try {
        sessionStorage.setItem("kotecki-order", JSON.stringify({ nr: data.number, total: data.total ?? total }));
      } catch {}
      if (data.checkoutUrl) {
        // Płatność na bezpiecznej stronie Stripe (karta / BLIK / Przelewy24).
        window.location.href = data.checkoutUrl;
        return;
      }
      clear();
      router.push(`/kasa/dziekujemy?order=${encodeURIComponent(data.number)}`);
    } catch {
      setError("Błąd połączenia z serwerem. Spróbuj ponownie za chwilę.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={placeOrder} className="container-edge grid gap-10 pb-24 lg:grid-cols-[1.4fr_1fr]">
      {canceled && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 lg:col-span-2">
          Płatność została anulowana. Twój koszyk jest nadal aktywny — możesz spróbować ponownie.
        </div>
      )}
      <div className="flex flex-col gap-9">
        {configured && !user && (
          <Link
            href="/logowanie"
            className="tap flex items-center justify-between gap-3 rounded-xl border border-line bg-cream/60 px-4 py-3 text-sm hover:border-ink/30"
          >
            <span className="text-ink-soft">
              Masz konto? <span className="font-medium text-ink">Zaloguj się</span> — dane i adres podstawią się same.
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        )}

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-lg font-semibold">Dane kontaktowe</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <input required type="email" placeholder="E-mail" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
            <input required type="tel" placeholder="Telefon" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input required placeholder="Imię" className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input required placeholder="Nazwisko" className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-lg font-semibold">Sposób dostawy</legend>
          <div className="flex flex-col gap-2">
            {DELIVERY.map((d) => {
              const cost = subtotal >= freeFrom ? 0 : d.cost;
              return (
                <label
                  key={d.id}
                  className={`tap flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3.5 text-sm ${
                    delivery === d.id ? "border-ink bg-cream" : "border-line hover:border-ink/40"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="delivery"
                      checked={delivery === d.id}
                      onChange={() => setDelivery(d.id)}
                      className="h-4 w-4 accent-coral"
                    />
                    <span>
                      <span className="block font-medium">{d.label}</span>
                      <span className="block text-xs text-ash">{d.sub}</span>
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">{cost === 0 ? "0 zł" : formatPrice(cost)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {selected.method === "inpost_locker" && (
          <fieldset>
            <legend className="mb-3 text-lg font-semibold">Wybierz paczkomat</legend>
            <LockerPicker
              value={locker}
              label={lockerLabel}
              onSelect={(code, lbl) => {
                setLocker(code);
                setLockerLabel(lbl);
              }}
            />
          </fieldset>
        )}

        {selected.method === "inpost_courier" && (
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 text-lg font-semibold">Adres dostawy</legend>

            {user && addresses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {addresses.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => applyAddress(a)}
                    className={`tap rounded-xl border px-3 py-2 text-xs ${
                      activeAddr === a.id ? "border-ink bg-cream" : "border-line hover:border-ink/40"
                    }`}
                  >
                    {a.label || `${a.street} ${a.building}`}
                    {a.is_default ? " · ★" : ""}
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-[1fr_0.4fr]">
              <input required placeholder="Ulica" className={inputCls} value={street} onChange={(e) => setStreet(e.target.value)} />
              <input required placeholder="Nr" className={inputCls} value={building} onChange={(e) => setBuilding(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-[0.5fr_1fr]">
              <input required placeholder="Kod pocztowy" className={inputCls} value={postal} onChange={(e) => setPostal(e.target.value)} />
              <input required placeholder="Miejscowość" className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} />
            </div>

            {user && (
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
                <input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} className="h-4 w-4 accent-coral" />
                Zapisz ten adres w moim koncie
              </label>
            )}
          </fieldset>
        )}

        <div className="rounded-lg border border-line bg-cream/60 px-4 py-3 text-sm text-ink-soft">
          Płatność: <span className="font-medium text-ink">karta, BLIK lub Przelewy24</span> — wybierzesz ją na
          bezpiecznej stronie Stripe po kliknięciu „Zamawiam i płacę”.
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-32">
        <h2 className="text-lg font-semibold">Twoje zamówienie</h2>
        <ul className="mt-5 flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.slug} className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line">
                <ProductMedia image={item.image} name={item.name} motif={item.motif} sizes="3.5rem" />
                <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[0.65rem] text-milk">
                  {item.qty}
                </span>
              </div>
              <span className="flex-1 text-sm leading-snug">{item.name}</span>
              <span className="text-sm tabular-nums">{formatPrice(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>

        {/* Kod rabatowy */}
        <div className="mt-5 border-t border-line pt-4">
          <label className="mb-1.5 block text-xs font-medium text-ash">Kod rabatowy 🐾</label>
          <div className="flex gap-2">
            <input
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                setPromoOk(false);
                setPromoDiscount(0);
              }}
              placeholder="np. KOTEK10"
              className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm uppercase outline-none focus:border-orange"
            />
            <button
              type="button"
              onClick={applyPromo}
              className="tap shrink-0 rounded-xl border border-line bg-cream px-4 py-2.5 text-sm font-semibold hover:border-ink"
            >
              Zastosuj
            </button>
          </div>
          {promoMsg && <p className={`mt-1.5 text-xs ${promoOk ? "text-teal" : "text-ash"}`}>{promoMsg}</p>}
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-line pt-5 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-soft">Produkty</span>
            <span className="tabular-nums">{formatPrice(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between font-medium text-teal">
              <span>Rabat</span>
              <span className="tabular-nums">−{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-ink-soft">Dostawa</span>
            <span className="tabular-nums">{deliveryCost === 0 ? "0 zł" : formatPrice(deliveryCost)}</span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <span className="font-medium">Razem</span>
          <span className="text-2xl font-semibold tabular-nums">{formatPrice(total)}</span>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-xs text-ink-soft">
          <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-coral" />
          <span>
            Akceptuję{" "}
            <Link href="/regulamin" target="_blank" className="underline hover:text-ink">
              regulamin
            </Link>{" "}
            i{" "}
            <Link href="/polityka-prywatnosci" target="_blank" className="underline hover:text-ink">
              politykę prywatności
            </Link>
            .
          </span>
        </label>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading || !accept}
          className="tap mt-4 w-full rounded-xl bg-coral px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-coral/20 hover:bg-coral-deep disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {loading ? "Przekierowuję do płatności…" : "Zamawiam i płacę"}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-mist">
          <span aria-hidden="true">🔒</span> Bezpieczna płatność — karta, BLIK, Przelewy24
        </p>
      </aside>
    </form>
  );
}
