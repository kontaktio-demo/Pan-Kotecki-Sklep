"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/account/AuthProvider";
import { CenterSpinner, StatusBadge, formatDate, ErrorNote } from "@/components/account/ui";
import { getOrder, type AccountOrderDetail } from "@/lib/account";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart";
import { getProductBySlug } from "@/lib/products";
import ProductMedia from "@/components/shop/ProductMedia";

const SHIPPING_LABEL: Record<string, string> = {
  inpost_locker: "Paczkomat InPost",
  inpost_courier: "Kurier InPost",
  pickup: "Odbiór osobisty",
};

export default function OrderDetailPage() {
  const { user, loading } = useAuth();
  const params = useParams<{ number: string }>();
  const number = decodeURIComponent(String(params.number ?? ""));
  const router = useRouter();
  const add = useCart((s) => s.add);

  const [order, setOrder] = useState<AccountOrderDetail | null>(null);
  const [err, setErr] = useState("");
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    getOrder(number).then(setOrder).catch((e) => setErr(e.message));
  }, [user, loading, number]);

  if (loading || !user) return <CenterSpinner />;

  if (err) {
    return (
      <div>
        <Back />
        <div className="mt-5"><ErrorNote msg={err} /></div>
      </div>
    );
  }
  if (!order) return <CenterSpinner />;

  async function reorder() {
    if (!order || reordering) return;
    setReordering(true);
    // Pobierz AKTUALNE ceny i dostępność (nie historyczne) - pomiń niedostępne.
    for (const it of order.items) {
      if (!it.slug) continue;
      const prod = await getProductBySlug(it.slug).catch(() => undefined);
      if (prod && prod.inStock) {
        add(
          { slug: prod.slug, name: prod.name, price: prod.price, motif: prod.visual?.motif ?? "", tone: prod.visual?.tone ?? "", image: prod.images?.[0] },
          it.qty,
        );
      }
    }
    router.push("/koszyk");
  }

  const addr = order.shippingAddress as Record<string, string> | null;

  return (
    <div>
      <Back />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold md:text-3xl">{order.number}</h1>
          <StatusBadge status={order.status} />
        </div>
        <button onClick={reorder} disabled={reordering} className="tap rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-milk hover:bg-coral disabled:opacity-60">
          {reordering ? "Dodaję..." : "Zamów ponownie"}
        </button>
      </div>
      <p className="mt-1 text-sm text-ash">Złożone {formatDate(order.createdAt)}</p>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Produkty */}
        <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-white">
          {order.items.map((it, i) => (
            <li key={i} className="flex items-center gap-4 p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-cream">
                <ProductMedia image={it.image ?? undefined} name={it.name} motif="" sizes="4rem" />
              </div>
              <div className="min-w-0 flex-1">
                {it.slug ? (
                  <Link href={`/sklep/${it.slug}`} className="text-sm font-medium leading-snug hover:text-coral">
                    {it.name}
                  </Link>
                ) : (
                  <span className="text-sm font-medium leading-snug">{it.name}</span>
                )}
                <p className="mt-0.5 text-sm text-ash">{it.qty} x {formatPrice(it.price)}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(it.price * it.qty)}</span>
            </li>
          ))}
        </ul>

        {/* Podsumowanie + dostawa */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-line bg-white p-5 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-ink-soft">Produkty</span>
              <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between py-1 text-teal">
                <span>Rabat {order.promoCode ? `(${order.promoCode})` : ""}</span>
                <span className="tabular-nums">−{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-ink-soft">Dostawa</span>
              <span className="tabular-nums">{order.shipping === 0 ? "0 zł" : formatPrice(order.shipping)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-3">
              <span className="font-medium">Razem</span>
              <span className="text-lg font-semibold tabular-nums">{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 text-sm">
            <p className="font-medium">Dostawa</p>
            <p className="mt-1 text-ink-soft">{SHIPPING_LABEL[order.shippingMethod ?? ""] ?? order.shippingMethod ?? "-"}</p>
            {order.parcelLocker && <p className="mt-1 text-ink-soft">Paczkomat: <span className="font-medium text-ink">{order.parcelLocker}</span></p>}
            {addr && (addr.street || addr.city) && (
              <p className="mt-1 text-ink-soft">
                {addr.first_name} {addr.last_name}<br />
                {addr.street} {addr.building_number}<br />
                {addr.post_code} {addr.city}
              </p>
            )}
            {order.trackingNumber && (
              <p className="mt-2 text-ink-soft">
                Nr przesyłki: <span className="font-medium text-ink">{order.trackingNumber}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Back() {
  return (
    <Link href="/konto/zamowienia" className="inline-flex items-center gap-1.5 text-sm text-ash transition-colors hover:text-ink">
      <span aria-hidden="true">←</span> Wszystkie zamówienia
    </Link>
  );
}
