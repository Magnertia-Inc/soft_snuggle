"use client";

import Link from "next/link";
import { useState } from "react";
import type { Review, ReviewablePiece } from "@/lib/reviews";
import { REVIEW_REWARD } from "@/lib/store";
import { RewardCode, StarPicker, StarsShow, lastDay } from "./Stars";

interface Props {
  code: string;
  accessKey: string;
  phone: string;
  pieces: ReviewablePiece[];
  rewardOn: boolean;
}

const DAY = 86_400_000;

/** One card per piece in the order: write a review, or see the one written. Earns RR5. */
export function ReviewPieces({ code, accessKey, phone, pieces: initial, rewardOn: initialRewardOn }: Props) {
  const [pieces, setPieces] = useState(initial);
  const [rewardOn, setRewardOn] = useState(initialRewardOn);
  const written = pieces.map((p) => p.review).filter((r): r is Review => !!r);
  const firstAt = written.length ? Math.min(...written.map((r) => new Date(r.createdAt).getTime())) : null;

  const saved = (productId: number, review: Review, on: boolean) => {
    setPieces((ps) => ps.map((p) => (p.productId === productId ? { ...p, review } : p)));
    setRewardOn(on);
  };

  return (
    <section id="reviews" className="scroll-mt-28 rounded-[1.75rem] border border-line bg-paper p-5 sm:p-7">
      <p className="eyebrow">Rating & review</p>
      <h2 className="mt-2 font-display text-3xl tracking-tight">Review what you bought</h2>
      <p className="mt-1 text-ink-soft">
        Help other parents choose.
        {rewardOn && <> Review a piece and get <b className="text-ink">{REVIEW_REWARD.code}</b>, {REVIEW_REWARD.percent}% off your next order.</>}
      </p>

      {rewardOn && firstAt && (
        <div className="mt-5">
          <RewardCode
            code={REVIEW_REWARD.code}
            percent={REVIEW_REWARD.percent}
            phone={phone}
            until={lastDay(new Date(firstAt + REVIEW_REWARD.days * DAY).toISOString())}
            title="Thanks for your review! Here's your code"
          />
        </div>
      )}

      <ul className="mt-5 space-y-4">
        {pieces.map((p) => (
          <Piece key={p.productId} piece={p} code={code} accessKey={accessKey} onSaved={saved} />
        ))}
      </ul>
    </section>
  );
}

function Piece({
  piece: p,
  code,
  accessKey,
  onSaved,
}: {
  piece: ReviewablePiece;
  code: string;
  accessKey: string;
  onSaved: (productId: number, review: Review, rewardOn: boolean) => void;
}) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setError("Tap the stars to rate this piece.");
    if (body.trim().length < 10) return setError("Please write a few words about it.");
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${code}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: accessKey, productId: p.productId, rating, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "We couldn't save that. Please try again.");
      onSaved(p.productId, data.review, !!data.rewardOn);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't save that. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const title = p.slug ? (
    <Link href={`/product/${p.slug}`} className="font-bold hover:underline">{p.name}</Link>
  ) : (
    <span className="font-bold">{p.name}</span>
  );

  return (
    <li className="rounded-2xl border border-line bg-cream/40 p-4">
      <div className="flex items-center gap-3">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt="" className="h-16 w-14 shrink-0 rounded-xl bg-paper object-cover" />
        ) : (
          <span className="h-16 w-14 shrink-0 rounded-xl bg-sage" />
        )}
        <div className="min-w-0">
          {title}
          {p.review && (
            <p className="text-sm text-ink-soft">
              <StarsShow rating={p.review.rating} /> · {p.review.status === "approved" ? "On the product page" : "Thanks! It shows once we've checked it"}
            </p>
          )}
        </div>
      </div>
      {p.review ? (
        <p className="mt-3 whitespace-pre-line text-[0.95rem]">{p.review.body}</p>
      ) : (
        <form onSubmit={send} className="mt-3" noValidate>
          <StarPicker value={rating} onChange={(n) => { setRating(n); setError(null); }} label={`Your rating of ${p.name}`} />
          <label htmlFor={`review-${p.productId}`} className="sr-only">Your review of {p.name}</label>
          <textarea
            id={`review-${p.productId}`}
            className="field mt-2 min-h-20 resize-y"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
            placeholder="How's the fabric, the fit, the colours? What would you tell another parent?"
          />
          {error && <p role="alert" className="mt-2 text-sm font-semibold text-[#B4513F]">{error}</p>}
          <button disabled={saving} className="btn-primary mt-3 w-full py-3 sm:w-auto sm:px-8">
            {saving ? "Posting…" : "Post review"}
          </button>
        </form>
      )}
    </li>
  );
}
