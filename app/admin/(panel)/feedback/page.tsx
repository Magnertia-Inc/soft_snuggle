import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { when } from "@/lib/admin-labels";
import { listFeedback } from "@/lib/feedback";
import { FEEDBACK_REWARD } from "@/lib/store";

export const metadata = { title: "Feedback" };

export default async function FeedbackPage() {
  await requireAdmin();
  const entries = await listFeedback();
  const average = entries.length ? entries.reduce((sum, e) => sum + e.rating, 0) / entries.length : 0;
  // Once per number, so a customer who rated two orders counts once.
  const used = new Set(entries.filter((e) => e.rewardUsedOn).map((e) => e.phone)).size;

  return (
    <div>
      <p className="eyebrow">Feedback</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">What customers say</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Customers rate their order on its page right after placing it. Each one gets the code {FEEDBACK_REWARD.code} for{" "}
        {FEEDBACK_REWARD.percent}% off a later order, usable once with the same mobile number within {FEEDBACK_REWARD.days} days.
        You can switch the code off on the <Link href="/admin/coupons" className="font-bold underline">Coupons</Link> page.
      </p>

      {entries.length > 0 && (
        <dl className="mt-6 grid grid-cols-3 gap-3 sm:max-w-xl">
          <div className="rounded-[1.25rem] border border-line bg-paper p-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-ink-soft">Average</dt>
            <dd className="mt-1 font-display text-3xl">{average.toFixed(1)} <span className="text-xl text-[#E0A526]">★</span></dd>
          </div>
          <div className="rounded-[1.25rem] border border-line bg-paper p-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-ink-soft">Ratings</dt>
            <dd className="mt-1 font-display text-3xl">{entries.length}</dd>
          </div>
          <div className="rounded-[1.25rem] border border-line bg-paper p-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-ink-soft">{FEEDBACK_REWARD.code} used</dt>
            <dd className="mt-1 font-display text-3xl">{used}</dd>
          </div>
        </dl>
      )}

      {entries.length === 0 ? (
        <p className="mt-6 rounded-[1.5rem] border border-dashed border-line px-5 py-8 text-center text-ink-soft">
          No feedback yet. It appears here as soon as a customer rates an order.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-[1.5rem] border border-line bg-paper">
          {entries.map((e) => (
            <li key={e.orderCode} className="px-5 py-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-lg tracking-widest text-[#E0A526]" aria-label={`${e.rating} out of 5 stars`}>
                  {"★".repeat(e.rating)}<span className="text-line">{"★".repeat(5 - e.rating)}</span>
                </span>
                <span className="font-bold">{e.customerName}</span>
                <Link href={`/admin/orders/${e.orderCode}`} className="text-sm font-bold underline underline-offset-4">{e.orderCode}</Link>
                <span className="text-sm text-ink-soft">{when(e.createdAt)}</span>
                {e.rewardUsedOn && (
                  <span className="rounded-full bg-sage px-2 py-0.5 text-[0.6875rem] font-extrabold">
                    Used {FEEDBACK_REWARD.code} on {e.rewardUsedOn}
                  </span>
                )}
              </div>
              {e.comment ? (
                <p className="mt-1.5 whitespace-pre-line">{e.comment}</p>
              ) : (
                <p className="mt-1.5 text-sm text-ink-soft">No comment</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
