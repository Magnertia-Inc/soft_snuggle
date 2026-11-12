import { StarsShow } from "@/components/feedback/Stars";
import type { Review } from "@/lib/reviews";

const dateIN = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/** Approved reviews of a piece. Shows nothing until the first one is approved. */
export function ProductReviews({ reviews, count, average }: { reviews: Review[]; count: number; average: number }) {
  if (!count) return null;
  return (
    <section id="reviews" className="shell pb-20" aria-labelledby="reviews-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="reviews-title" className="font-display text-3xl tracking-tight sm:text-4xl">
          What parents <em className="text-sage-deep">say</em>
        </h2>
        <p className="flex items-center gap-2 text-ink-soft">
          <StarsShow rating={average} className="text-xl" />
          <span className="font-bold text-ink">{average.toFixed(1)}</span>
          <span>· {count} {count === 1 ? "review" : "reviews"}</span>
        </p>
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-[1.5rem] border border-line bg-paper p-5">
            <StarsShow rating={r.rating} />
            <p className="mt-2 whitespace-pre-line">{r.body}</p>
            <p className="mt-3 text-sm text-ink-soft">
              <b className="text-ink">{r.name}</b> · Verified purchase · {dateIN(r.createdAt)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
