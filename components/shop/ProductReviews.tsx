import Paw from "@/components/ui/Paw";
import { getReviews, reviewsEnabled } from "@/lib/reviews";
import ReviewList from "./ReviewList";
import ReviewForm from "./ReviewForm";

// Prawdziwe opinie klientów (tylko zweryfikowany zakup, moderowane).
// Server component - pierwsza strona opinii jest w HTML (SEO).
export default async function ProductReviews({ slug }: { slug: string }) {
  if (!reviewsEnabled) return null;
  const data = await getReviews(slug);
  if (!data) return null;

  const { summary } = data;
  const count = summary.count;

  return (
    <section id="opinie" className="container-edge mt-20 scroll-mt-24 md:mt-28">
      <div className="mb-7 flex items-center gap-2">
        <Paw className="h-5 w-5 text-orange" />
        <h2 className="text-2xl font-semibold md:text-3xl">Opinie kupujących</h2>
      </div>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div>
          {count > 0 && summary.avg != null ? (
            <div className="rounded-2xl border border-line bg-white p-6">
              <p className="flex items-end gap-2">
                <span className="text-5xl font-semibold tabular-nums">{summary.avg.toFixed(1)}</span>
                <span className="pb-1.5 text-sm text-ash">/ 5</span>
              </p>
              <p className="mt-1 text-sm text-coral" aria-hidden="true">
                {"★".repeat(Math.round(summary.avg))}
                <span className="text-line">{"★".repeat(5 - Math.round(summary.avg))}</span>
              </p>
              <p className="mt-1 text-sm text-ash">
                {count} {count === 1 ? "opinia" : count < 5 ? "opinie" : "opinii"} ze zweryfikowanych zakupów
              </p>
              <div className="mt-4 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const n = summary.stars[star] ?? 0;
                  const pct = count > 0 ? Math.round((n / count) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs text-ash">
                      <span className="w-6 tabular-nums">{star}★</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-cream">
                        <span className="block h-full rounded-full bg-coral" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="w-8 text-right tabular-nums">{n}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-cream/50 p-6 text-center">
              <Paw className="mx-auto h-8 w-8 text-mist" />
              <p className="mt-3 font-medium">Ten produkt czeka na pierwszą opinię</p>
              <p className="mt-1 text-sm text-ash">Kupiłeś? Podziel się wrażeniami - swoimi i kota.</p>
            </div>
          )}

          <ReviewForm slug={slug} />
        </div>

        <ReviewList slug={slug} initial={data} />
      </div>
    </section>
  );
}
