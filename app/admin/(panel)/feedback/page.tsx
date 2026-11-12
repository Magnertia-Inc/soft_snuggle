import Link from "next/link";
import { FeedbackFollowUp } from "@/components/admin/FeedbackFollowUp";
import { requireAdmin } from "@/lib/admin";
import { when } from "@/lib/admin-labels";
import { FEEDBACK_STATUSES, feedbackMailStats, listFeedback, repeatPurchase, rewardUses, type FeedbackStatus } from "@/lib/feedback";
import { reviewsByProduct } from "@/lib/reviews";
import {
  FEEDBACK_ASPECTS, FEEDBACK_MAIL_AFTER_DAYS, FEEDBACK_REWARD, IMPROVE_AREAS, RECOMMEND_ANSWERS, REVIEW_REWARD,
} from "@/lib/store";

export const metadata = { title: "Feedback" };

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const label = <T extends { key: string; label: string }>(list: readonly T[], key: string) => list.find((x) => x.key === key)?.label ?? key;

function Stars({ n }: { n: number }) {
  const full = Math.round(n);
  return (
    <span className="tracking-[0.12em] text-[#E0A526]" aria-label={`${n.toFixed(1)} out of 5`}>
      {"★".repeat(full)}<span className="text-line">{"★".repeat(5 - full)}</span>
    </span>
  );
}

function Bar({ value, max, children }: { value: number; max: number; children: React.ReactNode }) {
  return (
    <li className="py-2">
      <div className="flex items-baseline justify-between gap-3 text-sm">{children}</div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line/70">
        <div className="h-full rounded-full bg-sage-deep" style={{ width: `${max ? Math.max(3, (value / max) * 100) : 0}%` }} />
      </div>
    </li>
  );
}

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const [entries, repeat, mail, uses, byReviews] = await Promise.all([
    listFeedback(), repeatPurchase(), feedbackMailStats(), rewardUses(), reviewsByProduct(),
  ]);
  const filter = (await searchParams).status as FeedbackStatus | undefined;
  const shown = filter && FEEDBACK_STATUSES.some((s) => s.key === filter) ? entries.filter((e) => e.status === filter) : entries;

  const n = entries.length;
  const satisfied = entries.filter((e) => e.rating >= 4).length;
  const answeredRecommend = entries.filter((e) => e.recommend);
  const kind = (k: string | null) => RECOMMEND_ANSWERS.find((a) => a.key === k)?.counts;
  const promoters = answeredRecommend.filter((e) => kind(e.recommend) === "promoter").length;
  const detractors = answeredRecommend.filter((e) => kind(e.recommend) === "detractor").length;
  const recommendScore = answeredRecommend.length ? pct(promoters, answeredRecommend.length) - pct(detractors, answeredRecommend.length) : null;

  const areas = [
    { key: "overall", label: "Overall satisfaction", values: entries.map((e) => e.rating) },
    ...FEEDBACK_ASPECTS.map((a) => ({ key: a.key, label: a.label, values: entries.map((e) => e.ratings[a.key]).filter((v): v is number => !!v) })),
  ];
  const improveCounts = IMPROVE_AREAS.map((a) => ({ ...a, n: entries.filter((e) => e.improve.includes(a.key)).length }))
    .filter((a) => a.n > 0)
    .sort((a, b) => b.n - a.n);

  // Product quality: the overall rating of every order a piece was in, next to its own reviews.
  const byProduct = new Map<number, { name: string; ratings: number[] }>();
  for (const e of entries) {
    for (const it of e.items) {
      const p = byProduct.get(it.productId) ?? { name: it.name, ratings: [] };
      p.ratings.push(e.rating);
      byProduct.set(it.productId, p);
    }
  }
  const productRows = [...new Set([...byProduct.keys(), ...byReviews.map((r) => r.productId)])]
    .map((id) => {
      const f = byProduct.get(id);
      const r = byReviews.find((x) => x.productId === id);
      return { id, name: f?.name ?? r?.name ?? "", orders: f?.ratings.length ?? 0, orderAvg: avg(f?.ratings ?? []), reviews: r?.count ?? 0, reviewAvg: r?.average ?? 0 };
    })
    .sort((a, b) => b.orders + b.reviews - (a.orders + a.reviews));
  const testimonials = entries.filter((e) => e.testimonialOk && e.liked);

  const kpis = [
    { label: "Responses", value: String(n), hint: mail.sent ? `${pct(mail.answered, mail.sent)}% of ${mail.sent} emailed answered` : "No feedback emails sent yet" },
    { label: "Satisfied", value: n ? `${pct(satisfied, n)}%` : "–", hint: "Rated their order 4 or 5 stars" },
    { label: "Recommend score", value: recommendScore == null ? "–" : `${recommendScore > 0 ? "+" : ""}${recommendScore}`, hint: "% Definitely minus % Not sure / Probably not" },
    { label: "Average rating", value: n ? avg(entries.map((e) => e.rating)).toFixed(1) : "–", hint: "Overall, out of 5" },
    { label: "Repeat customers", value: repeat.buyers ? `${pct(repeat.repeat, repeat.buyers)}%` : "–", hint: `${repeat.repeat} of ${repeat.buyers} numbers ordered twice or more` },
    { label: `${FEEDBACK_REWARD.code} used`, value: String(uses[FEEDBACK_REWARD.code] ?? 0), hint: "Orders using the feedback code" },
    { label: `${REVIEW_REWARD.code} used`, value: String(uses[REVIEW_REWARD.code] ?? 0), hint: "Orders using the review code" },
  ];

  return (
    <div>
      <p className="eyebrow">Feedback</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">What customers say</h1>
      <p className="mt-2 max-w-3xl text-ink-soft">
        {FEEDBACK_MAIL_AFTER_DAYS} days after you mark an order delivered, the customer is emailed a link to the feedback form (if they gave an
        email; otherwise send it from the order page on WhatsApp). The form earns {FEEDBACK_REWARD.code}, and reviewing a piece earns{" "}
        {REVIEW_REWARD.code}: {FEEDBACK_REWARD.percent}% off a later order each, once per mobile number, within {FEEDBACK_REWARD.days} days.
        Anyone who rates an order 1 or 2 stars is emailed to you straight away. Switch the codes off on{" "}
        <Link href="/admin/coupons" className="font-bold underline">Coupons</Link>; approve reviews on{" "}
        <Link href="/admin/reviews" className="font-bold underline">Reviews</Link>.
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-[1.25rem] border border-line bg-paper p-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-ink-soft">{k.label}</dt>
            <dd className="mt-1 font-display text-3xl">{k.value}</dd>
            <dd className="mt-0.5 text-xs text-ink-soft">{k.hint}</dd>
          </div>
        ))}
      </dl>

      {n > 0 && (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[1.5rem] border border-line bg-paper p-5">
            <h2 className="font-display text-xl">Ratings by area</h2>
            <ul className="mt-2">
              {areas.map((a) => (
                <Bar key={a.key} value={avg(a.values)} max={5}>
                  <span className="font-semibold">{a.label}</span>
                  <span className="text-ink-soft">{a.values.length ? <><b className="text-ink">{avg(a.values).toFixed(1)}</b> · {a.values.length} rated</> : "Not rated yet"}</span>
                </Bar>
              ))}
            </ul>
          </section>
          <section className="rounded-[1.5rem] border border-line bg-paper p-5">
            <h2 className="font-display text-xl">What to improve</h2>
            {improveCounts.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Nobody has ticked anything to improve yet.</p>
            ) : (
              <ul className="mt-2">
                {improveCounts.map((a) => (
                  <Bar key={a.key} value={a.n} max={n}>
                    <span className="font-semibold">{a.label}</span>
                    <span className="text-ink-soft"><b className="text-ink">{a.n}</b> · {pct(a.n, n)}% of responses</span>
                  </Bar>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {productRows.length > 0 && (
        <section className="mt-5 overflow-x-auto rounded-[1.5rem] border border-line bg-paper p-5">
          <h2 className="font-display text-xl">Product quality</h2>
          <table className="mt-3 w-full min-w-[30rem] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-ink-soft">
                <th className="pb-2 font-bold">Piece</th>
                <th className="pb-2 font-bold">Orders rated</th>
                <th className="pb-2 font-bold">Its reviews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {productRows.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 pr-3 font-semibold">{p.name}</td>
                  <td className="py-2 pr-3">{p.orders ? <><Stars n={p.orderAvg} /> {p.orderAvg.toFixed(1)} · {p.orders}</> : "–"}</td>
                  <td className="py-2">{p.reviews ? <><Stars n={p.reviewAvg} /> {p.reviewAvg.toFixed(1)} · {p.reviews}</> : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="mt-5 rounded-[1.5rem] border border-line bg-paper p-5">
          <h2 className="font-display text-xl">Testimonials you may use</h2>
          <p className="text-sm text-ink-soft">These customers agreed to their words being shared, with their first name only.</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {testimonials.map((e) => (
              <li key={e.orderCode} className="rounded-2xl bg-cream p-4">
                <Stars n={e.rating} />
                <blockquote className="mt-1.5">“{e.liked}”</blockquote>
                <p className="mt-1.5 text-sm font-bold">{e.customerName.split(" ")[0]}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <h2 className="mr-2 font-display text-2xl">Every response</h2>
        {[{ key: "", label: "All" }, ...FEEDBACK_STATUSES].map((s) => {
          const on = (filter ?? "") === s.key;
          const count = s.key ? entries.filter((e) => e.status === s.key).length : n;
          return (
            <Link
              key={s.key || "all"}
              href={s.key ? `/admin/feedback?status=${s.key}` : "/admin/feedback"}
              className={`rounded-full px-4 py-2 text-sm font-bold ${on ? "bg-ink text-paper" : "text-ink-soft hover:bg-sage/60"}`}
            >
              {s.label} · {count}
            </Link>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <p className="mt-4 rounded-[1.5rem] border border-dashed border-line px-5 py-8 text-center text-ink-soft">
          {n === 0 ? "No feedback yet. It appears here as soon as a customer sends the form." : "Nothing here."}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {shown.map((e) => (
            <li key={e.orderCode} id={e.orderCode} className={`scroll-mt-24 rounded-[1.5rem] border bg-paper p-5 ${e.rating <= 2 && e.status === "new" ? "border-[#d9a08f]" : "border-line"}`}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-lg"><Stars n={e.rating} /></span>
                <span className="font-bold">{e.customerName}</span>
                <Link href={`/admin/orders/${e.orderCode}`} className="text-sm font-bold underline underline-offset-4">{e.orderCode}</Link>
                <span className="text-sm text-ink-soft">{when(e.createdAt)}</span>
                <span className="rounded-full bg-line/70 px-2 py-0.5 text-[0.6875rem] font-extrabold">{label(FEEDBACK_STATUSES, e.status)}</span>
                {e.rewardUsedOn && (
                  <span className="rounded-full bg-sage px-2 py-0.5 text-[0.6875rem] font-extrabold">Used {FEEDBACK_REWARD.code} on {e.rewardUsedOn}</span>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-soft">{e.items.map((i) => i.name).join(" · ")}</p>

              {Object.keys(e.ratings).length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  {FEEDBACK_ASPECTS.filter((a) => e.ratings[a.key]).map((a) => (
                    <li key={a.key}>
                      <span className="text-ink-soft">{a.label}</span> <b>{e.ratings[a.key]}</b>
                    </li>
                  ))}
                </ul>
              )}
              {e.improve.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  <span className="font-bold text-ink-soft">Improve:</span>
                  {e.improve.map((k) => (
                    <span key={k} className="rounded-full bg-butter px-2 py-0.5 font-bold">{label(IMPROVE_AREAS, k)}</span>
                  ))}
                </p>
              )}
              <dl className="mt-2 space-y-1 text-[0.95rem]">
                {e.liked && <div><dt className="inline font-bold">Liked most: </dt><dd className="inline whitespace-pre-line">{e.liked}</dd></div>}
                {e.wish && <div><dt className="inline font-bold">Wants next: </dt><dd className="inline whitespace-pre-line">{e.wish}</dd></div>}
                {e.comment && <div><dt className="inline font-bold">Comment: </dt><dd className="inline whitespace-pre-line">{e.comment}</dd></div>}
                {e.recommend && (
                  <div className="text-sm text-ink-soft">
                    Would recommend: <b className="text-ink">{label(RECOMMEND_ANSWERS, e.recommend)}</b>
                    {e.testimonialOk && " · OK to use as a testimonial"}
                  </div>
                )}
              </dl>
              <FeedbackFollowUp code={e.orderCode} status={e.status} note={e.adminNote} />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-sm text-ink-soft">
        Still to come: return rate, complaint resolution time and defect rate, once returns and complaints are logged on orders.
      </p>
    </div>
  );
}
