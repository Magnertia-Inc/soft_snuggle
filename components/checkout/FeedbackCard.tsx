"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Feedback } from "@/lib/feedback";
import { FEEDBACK_REWARD } from "@/lib/store";

const LABELS = ["", "Not good", "Could be better", "Okay", "Good", "Loved it"];

const lastDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

interface Props {
  code: string;
  accessKey: string;
  phone: string;
  initial: Feedback | null;
  /** Whether FBK5 is switched on, so the card only promises it while it works */
  rewardOn: boolean;
}

/** Rate this order, right after placing it; leaving a rating unlocks FBK5 for the next one. */
export function FeedbackCard({ code, accessKey, phone, initial, rewardOn: initialRewardOn }: Props) {
  const [feedback, setFeedback] = useState(initial);
  const [rewardOn, setRewardOn] = useState(initialRewardOn);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError("Tap a star to rate your order.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${code}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: accessKey, rating, comment }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "We couldn't save that. Please try again.");
      setFeedback(data.feedback);
      setRewardOn(!!data.rewardOn);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't save that. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(FEEDBACK_REWARD.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const shown = hover || rating;

  return (
    <section id="feedback" className="mt-8 scroll-mt-28 rounded-[1.75rem] border border-line bg-paper/70 p-6 sm:p-8">
      <AnimatePresence mode="wait" initial={false}>
        {feedback ? (
          <motion.div key="thanks" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="eyebrow">Your feedback</p>
            <h2 className="mt-2 font-display text-3xl">Thank you for rating us!</h2>
            <p className="mt-1 text-lg tracking-widest text-[#E0A526]" aria-label={`${feedback.rating} out of 5 stars`}>
              {"★".repeat(feedback.rating)}
              <span className="text-line">{"★".repeat(5 - feedback.rating)}</span>
            </p>
            {rewardOn && (
              <div className="mt-5 rounded-2xl bg-sage/60 p-5">
                <p className="text-sm font-bold">Here&apos;s {FEEDBACK_REWARD.percent}% off your next order</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="rounded-xl border-2 border-dashed border-ink/50 bg-paper px-4 py-2 font-mono text-2xl font-bold tracking-[0.2em]">
                    {FEEDBACK_REWARD.code}
                  </span>
                  <button onClick={copy} className="rounded-full bg-paper px-4 py-2 text-sm font-bold">
                    {copied ? "Copied ✓" : "Copy code"}
                  </button>
                </div>
                <p className="mt-3 text-sm text-ink-soft">
                  Enter it at checkout with this mobile number (+91 {phone}) by <b className="text-ink">{lastDay(feedback.rewardUntil)}</b>.
                  Works once.
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={send} exit={{ opacity: 0, y: -12 }}>
            <p className="eyebrow">Quick feedback</p>
            <h2 className="mt-2 font-display text-3xl">How was ordering with us?</h2>
            <p className="mt-2 text-ink-soft">
              {rewardOn
                ? <>Rate your order and get <b className="text-ink">{FEEDBACK_REWARD.percent}% off your next one</b>.</>
                : "Tell us how it went. It helps us get better."}
            </p>

            <div className="mt-5 flex items-center gap-1" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                  onClick={() => {
                    setRating(n);
                    setError(null);
                  }}
                  onMouseEnter={() => setHover(n)}
                  className={`text-4xl leading-none transition-transform hover:scale-110 sm:text-[2.75rem] ${n <= shown ? "text-[#E0A526]" : "text-line"}`}
                >
                  ★
                </button>
              ))}
              <span className="ml-3 text-sm font-bold text-ink-soft">{LABELS[shown]}</span>
            </div>

            <label htmlFor="feedback-comment" className="mb-1.5 mt-5 block text-sm font-bold text-ink-soft">
              Anything we could do better? <span className="font-normal">(optional)</span>
            </label>
            <textarea
              id="feedback-comment"
              className="field min-h-24 resize-y"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              placeholder="Finding things, sizes, checkout, anything at all"
            />
            {error && <p role="alert" className="mt-2 text-sm font-semibold text-[#B4513F]">{error}</p>}
            <button disabled={saving} className="btn-primary mt-5 w-full py-4 text-base sm:w-auto sm:px-10">
              {saving ? "Sending…" : rewardOn ? `Send & get ${FEEDBACK_REWARD.percent}% off` : "Send feedback"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  );
}
