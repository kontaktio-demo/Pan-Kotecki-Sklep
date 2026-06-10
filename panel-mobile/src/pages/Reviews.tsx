import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { dateStr } from "../format";
import { Spinner, ErrorNote, Empty, toast, ConfirmSheet } from "../ui";

// Moderacja opinii o produktach: pending → zatwierdź / odrzuć.
type Review = {
  id: string;
  rating: number;
  body: string;
  author_name: string;
  status: "pending" | "approved" | "rejected";
  verified: boolean;
  created_at: string;
  product: { name: string; slug: string } | null;
  order: { number: string; email: string } | null;
};

const PAGE = 20;
const FILTERS = [
  { key: "pending", label: "Do moderacji" },
  { key: "approved", label: "Zatwierdzone" },
  { key: "rejected", label: "Odrzucone" },
] as const;

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-cream text-ash",
};

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="text-sm tracking-wide text-orange" aria-label={`Ocena ${rating}/5`}>
      {"★".repeat(rating)}
      <span className="text-line">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function Reviews() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("pending");
  const [items, setItems] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [err, setErr] = useState("");
  const [toDelete, setToDelete] = useState<Review | null>(null);

  const load = useCallback(
    async (offset = 0) => {
      offset === 0 ? setLoading(true) : setMore(true);
      setErr("");
      try {
        const d = (await api.get(`/api/admin/reviews?status=${filter}&limit=${PAGE}&offset=${offset}`)) as {
          items: Review[];
          total: number;
        };
        setItems((cur) => (offset === 0 ? d.items : [...cur, ...d.items]));
        setTotal(d.total);
      } catch (e) {
        setErr((e as Error).message);
      } finally {
        setLoading(false);
        setMore(false);
      }
    },
    [filter],
  );

  useEffect(() => {
    void load(0);
  }, [load]);

  async function setStatus(r: Review, status: "approved" | "rejected") {
    try {
      await api.patch(`/api/admin/reviews/${r.id}`, { status });
      toast(status === "approved" ? "Opinia zatwierdzona" : "Opinia odrzucona");
      setItems((cur) => cur.filter((x) => x.id !== r.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      toast((e as Error).message, "err");
    }
  }

  async function remove(r: Review) {
    try {
      await api.del(`/api/admin/reviews/${r.id}`);
      toast("Opinia usunięta");
      setItems((cur) => cur.filter((x) => x.id !== r.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      toast((e as Error).message, "err");
    }
  }

  return (
    <div className="p-4 pb-24">
      <div className="mb-3 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
              filter === f.key ? "bg-ink text-white" : "bg-white text-ash"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ErrorNote msg={err} />

      {loading ? (
        <Spinner label="Wczytuję opinie..." />
      ) : items.length === 0 ? (
        <Empty
          emoji="⭐"
          title={filter === "pending" ? "Brak opinii do moderacji" : "Brak opinii"}
          hint={filter === "pending" ? "Nowe opinie klientów pojawią się tutaj." : undefined}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{r.product?.name ?? "(produkt usunięty)"}</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <StarRow rating={r.rating} />
                    <span className={`statuspill ${STATUS_TONE[r.status]}`}>
                      {FILTERS.find((f) => f.key === r.status)?.label ?? r.status}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{r.body}</p>
              <div className="mt-2 text-xs text-ash">
                {r.author_name} - {dateStr(r.created_at)}
                {r.order?.number && (
                  <>
                    {" "}- zamówienie <span className="font-medium text-ink">{r.order.number}</span>
                  </>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                {r.status !== "approved" && (
                  <button onClick={() => setStatus(r, "approved")} className="btn-primary flex-1 !py-2.5 text-sm">
                    Zatwierdź
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button onClick={() => setStatus(r, "rejected")} className="btn-ghost flex-1 !py-2.5 text-sm">
                    Odrzuć
                  </button>
                )}
                <button
                  onClick={() => setToDelete(r)}
                  className="rounded-xl border border-red-200 px-3 py-2.5 text-sm font-medium text-red-600 active:scale-[0.98]"
                >
                  Usuń
                </button>
              </div>
            </div>
          ))}

          {items.length < total && (
            <button onClick={() => load(items.length)} disabled={more} className="btn-ghost w-full">
              {more ? "Wczytuję..." : `Załaduj więcej (${total - items.length})`}
            </button>
          )}
        </div>
      )}

      {toDelete && (
        <ConfirmSheet
          title="Usunąć opinię?"
          message={`Opinia "${toDelete.author_name}" zniknie bezpowrotnie. Zwykle lepiej ją odrzucić.`}
          confirmLabel="Usuń"
          danger
          onConfirm={() => void remove(toDelete)}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
