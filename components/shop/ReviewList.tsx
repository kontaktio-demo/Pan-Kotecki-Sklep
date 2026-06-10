"use client";

import { useState } from "react";
import { getReviews, type Review, type ReviewsPayload } from "@/lib/reviews";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pl-PL", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

function ReviewCard({ r }: { r: Review }) {
  return (
    <figure className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-peach text-sm font-semibold text-orange-deep">
            {r.author.trim().charAt(0).toUpperCase() || "K"}
          </span>
          <div>
            <figcaption className="text-sm font-medium">{r.author}</figcaption>
            <p className="text-xs text-mist">{formatDate(r.createdAt)}</p>
          </div>
        </div>
        {r.verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-[0.68rem] font-semibold text-teal-deep">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 5 5L20 7" />
            </svg>
            Zweryfikowany zakup
          </span>
        )}
      </div>
      <p className="mt-3 text-sm tracking-wide text-coral" aria-label={`Ocena ${r.rating} na 5`}>
        <span aria-hidden="true">
          {"★".repeat(r.rating)}
          <span className="text-line">{"★".repeat(5 - r.rating)}</span>
        </span>
      </p>
      <blockquote className="mt-2 leading-relaxed text-ink-soft">{r.body}</blockquote>
    </figure>
  );
}

export default function ReviewList({ slug, initial }: { slug: string; initial: ReviewsPayload }) {
  const [reviews, setReviews] = useState<Review[]>(initial.reviews);
  const [page, setPage] = useState(initial.page);
  const [loading, setLoading] = useState(false);
  const hasMore = page < initial.pageCount;

  async function loadMore() {
    setLoading(true);
    const next = await getReviews(slug, page + 1);
    if (next) {
      setReviews((cur) => [...cur, ...next.reviews.filter((r) => !cur.some((c) => c.id === r.id))]);
      setPage(next.page);
    }
    setLoading(false);
  }

  if (reviews.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-line bg-white p-10 text-center text-sm text-ash">
        Jeszcze nikt nie ocenił tego produktu. Twoja opinia może być pierwsza.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <ReviewCard key={r.id} r={r} />
      ))}
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="tap w-full rounded-xl border border-ink/20 px-6 py-3 text-sm font-medium transition-colors hover:border-ink hover:bg-ink hover:text-milk disabled:opacity-60"
        >
          {loading ? "Wczytuję..." : "Pokaż więcej opinii"}
        </button>
      )}
    </div>
  );
}
