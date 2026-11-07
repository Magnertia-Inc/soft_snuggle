import Link from "next/link";
import { ReviewActions } from "@/components/admin/ReviewActions";
import { requireAdmin } from "@/lib/admin";
import { when } from "@/lib/admin-labels";
import { listReviews, reviewCounts, type ReviewStatus } from "@/lib/reviews";
import { REVIEW_REWARD } from "@/lib/store";

export const metadata = { title: "Reviews" };

const TABS: { key: ReviewStatus; label: string; empty: string }[] = [
  { key: "pending", label: "Waiting", empty: "No reviews waiting. New ones appear here first." },
  { key: "approved", label: "On the shop", empty: "No approved reviews yet." },
  { key: "hidden", label: "Hidden", empty: "Nothing hidden." },
];

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const tabKey = (await searchParams).tab;
  const tab = TABS.find((t) => t.key === tabKey) ?? TABS[0];
  const [reviews, counts] = await Promise.all([listReviews(tab.key), reviewCounts()]);

  return (
    <div>
      <p className="eyebrow">Reviews</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Product reviews</h1>
      <p className="mt-2 max-w-3xl text-ink-soft">
        Customers review the pieces they bought from their feedback page; each review earns them {REVIEW_REWARD.code} straight away. A review
        shows on the product page, signed with their first name and initial, once you approve it. Hide anything rude, off-topic or with
        personal details.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/reviews?tab=${t.key}`}
            className={`rounded-full px-4 py-2 text-sm font-bold ${t.key === tab.key ? "bg-ink text-paper" : "text-ink-soft hover:bg-sage/60"}`}
          >
            {t.label} · {counts[t.key]}
          </Link>
        ))}
      </nav>

      {reviews.length === 0 ? (
        <p className="mt-6 rounded-[1.5rem] border border-dashed border-line px-5 py-8 text-center text-ink-soft">{tab.empty}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-[1.5rem] border border-line bg-paper p-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-lg tracking-[0.12em] text-[#E0A526]" aria-label={`${r.rating} out of 5 stars`}>
                  {"★".repeat(r.rating)}<span className="text-line">{"★".repeat(5 - r.rating)}</span>
                </span>
                {r.productSlug ? (
                  <Link href={`/product/${r.productSlug}`} target="_blank" className="font-bold underline underline-offset-4">{r.productName} ↗</Link>
                ) : (
                  <span className="font-bold">{r.productName}</span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line">{r.body}</p>
              <p className="mt-2 text-sm text-ink-soft">
                Shown as <b className="text-ink">{r.name}</b> · {r.customerName} ·{" "}
                <Link href={`/admin/orders/${r.orderCode}`} className="font-bold underline underline-offset-4">{r.orderCode}</Link> · {when(r.createdAt)}
              </p>
              <div className="mt-3">
                <ReviewActions id={r.id} status={r.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
