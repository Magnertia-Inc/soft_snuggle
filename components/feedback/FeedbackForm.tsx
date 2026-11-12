"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { AspectKey, Feedback, ImproveKey, RecommendKey } from "@/lib/feedback";
import { FEEDBACK_ASPECTS, FEEDBACK_REWARD, IMPROVE_AREAS, RECOMMEND_ANSWERS } from "@/lib/store";
import { RewardCode, StarPicker, StarsShow, lastDay } from "./Stars";

interface Props {
  code: string;
  accessKey: string;
  phone: string;
  initial: Feedback | null;
  /** From the email's stars: the overall rating they tapped */
  startRating: number;
  rewardOn: boolean;
}

const card = "rounded-[1.75rem] border border-line bg-paper p-5 sm:p-7";

function Step({ n, title, hint }: { n: string; title: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sage font-display text-lg">{n}</span>
      <div>
        <h2 className="font-display text-2xl leading-tight tracking-tight">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-ink-soft">{hint}</p>}
      </div>
    </div>
  );
}

/** The feedback form, then the thank-you with FBK5 once it's sent. */
export function FeedbackForm({ code, accessKey, phone, initial, startRating, rewardOn: initialRewardOn }: Props) {
  const [feedback, setFeedback] = useState(initial);
  const [rewardOn, setRewardOn] = useState(initialRewardOn);
  const [rating, setRating] = useState(startRating);
  const [ratings, setRatings] = useState<Partial<Record<AspectKey, number>>>({});
  const [improve, setImprove] = useState<ImproveKey[]>([]);
  const [liked, setLiked] = useState("");
  const [wish, setWish] = useState("");
  const [recommend, setRecommend] = useState<RecommendKey | null>(null);
  const [testimonialOk, setTestimonialOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (k: ImproveKey) => setImprove((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]));

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError("Please give your overall rating (tap the stars at the top).");
      document.getElementById("overall")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${code}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: accessKey, rating, ratings, improve, liked, wish, recommend, testimonialOk }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "We couldn't save that. Please try again.");
      setFeedback(data.feedback);
      setRewardOn(!!data.rewardOn);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't save that. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {feedback ? (
        <motion.section key="thanks" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={card}>
          <p className="eyebrow">Your feedback</p>
          <h2 className="mt-2 font-display text-3xl">Thank you, it really helps!</h2>
          <StarsShow rating={feedback.rating} className="mt-1 block text-xl" />
          {rewardOn && (
            <div className="mt-5">
              <RewardCode
                code={FEEDBACK_REWARD.code}
                percent={FEEDBACK_REWARD.percent}
                phone={phone}
                until={lastDay(feedback.rewardUntil)}
                title={`Here's ${FEEDBACK_REWARD.percent}% off your next order`}
              />
            </div>
          )}
        </motion.section>
      ) : (
        <motion.form key="form" onSubmit={send} exit={{ opacity: 0, y: -12 }} className="space-y-5" noValidate>
          <section className={card}>
            <Step n="01" title="Your experience" hint="Rate each from 1 (poor) to 5 (excellent). Only the first one is needed." />
            <div id="overall" className="mt-5 rounded-2xl bg-cream p-4 sm:p-5">
              <p className="font-bold">Overall satisfaction <span className="text-[#B4513F]">*</span></p>
              <div className="mt-1">
                <StarPicker big value={rating} onChange={(n) => { setRating(n); setError(null); }} label="Overall satisfaction" />
              </div>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {FEEDBACK_ASPECTS.map((a) => (
                <li key={a.key} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0 text-[0.95rem] font-semibold leading-snug">{a.label}</span>
                  <div className="shrink-0">
                    <StarPicker
                      value={ratings[a.key] ?? 0}
                      onChange={(n) => setRatings((r) => ({ ...r, [a.key]: n }))}
                      label={a.label}
                      words={false}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className={card}>
            <Step n="02" title="What could we do better?" hint="Tick all that apply, or none if everything was great." />
            <div className="mt-4 flex flex-wrap gap-2">
              {IMPROVE_AREAS.map((a) => {
                const on = improve.includes(a.key);
                return (
                  <button
                    key={a.key}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(a.key)}
                    className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                      on ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink-soft hover:border-ink/40"
                    }`}
                  >
                    {on ? "✓ " : ""}{a.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={card}>
            <Step n="03" title="Tell us more" />
            <label htmlFor="liked" className="mb-1.5 mt-5 block text-sm font-bold text-ink-soft">What did you like most about Veviba?</label>
            <textarea id="liked" className="field min-h-24 resize-y" value={liked} onChange={(e) => setLiked(e.target.value)} maxLength={1000} placeholder="Share your experience…" />
            <label htmlFor="wish" className="mb-1.5 mt-4 block text-sm font-bold text-ink-soft">What would you like us to make next?</label>
            <textarea id="wish" className="field min-h-20 resize-y" value={wish} onChange={(e) => setWish(e.target.value)} maxLength={1000} placeholder="New designs, sizes, collections…" />
          </section>

          <section className={card}>
            <Step n="04" title="Would you recommend Veviba to friends and family?" />
            <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Would you recommend Veviba?">
              {RECOMMEND_ANSWERS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  role="radio"
                  aria-checked={recommend === a.key}
                  onClick={() => setRecommend(recommend === a.key ? null : a.key)}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                    recommend === a.key ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink-soft hover:border-ink/40"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-cream/60 px-4 py-3.5 text-sm">
              <input type="checkbox" checked={testimonialOk} onChange={(e) => setTestimonialOk(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#263B36]" />
              <span>Veviba may share what I liked as a testimonial, with my first name only.</span>
            </label>
          </section>

          {error && <p role="alert" className="text-center text-sm font-semibold text-[#B4513F]">{error}</p>}
          <button disabled={saving} className="btn-primary w-full py-4 text-base">
            {saving ? "Sending…" : rewardOn ? `Send feedback & get ${FEEDBACK_REWARD.percent}% off` : "Send feedback"}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
