"use client";

import { useEffect, useState } from "react";
import { REFERRAL_REWARD, STORE } from "@/lib/store";

interface Mine {
  code: string;
  link: string;
  friendsOrdered: number;
  earned: number;
  available: number;
  nextExpiry: string | null;
  used: number;
}

const lastDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

/** Refer & earn on the account page: the personal code to share, and the RE10s earned. */
export function ReferCard() {
  const [mine, setMine] = useState<Mine | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    fetch("/api/referrals")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setMine)
      .catch(() => setFailed(true));
  }, []);

  if (failed) return null;

  const copy = async (what: "code" | "link") => {
    if (!mine) return;
    try {
      await navigator.clipboard.writeText(what === "code" ? mine.code : mine.link);
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    } catch {}
  };
  const message = mine
    ? `I shop baby clothes at ${STORE.name}: soft cotton, freshly stitched. Have a look: ${mine.link} (my code: ${mine.code})`
    : "";

  return (
    <section aria-labelledby="refer-title" className="mt-8 rounded-[1.75rem] border border-line bg-paper p-6 sm:p-7">
      <p className="eyebrow">Refer &amp; earn</p>
      <h2 id="refer-title" className="mt-2 font-display text-3xl tracking-tight">
        Get {REFERRAL_REWARD.percent}% off for every friend
      </h2>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Share your code with friends. When a friend&apos;s first order reaches them, you get <b className="text-ink">{REFERRAL_REWARD.code}</b>:{" "}
        {REFERRAL_REWARD.percent}% off one order, for {REFERRAL_REWARD.days} days. One for every friend.
      </p>

      {!mine ? (
        <p className="mt-5 text-sm text-ink-soft">Getting your code…</p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="rounded-2xl border-2 border-dashed border-ink px-5 py-2.5 font-mono text-xl font-bold tracking-[0.12em] sm:text-2xl">
              {mine.code}
            </span>
            <button type="button" onClick={() => copy("code")} className="rounded-full border border-line px-4 py-2 text-sm font-bold">
              {copied === "code" ? "Copied ✓" : "Copy code"}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-sage px-4 py-2 text-sm font-bold"
            >
              Share on WhatsApp
            </a>
            <button type="button" onClick={() => copy("link")} className="rounded-full border border-line px-4 py-2 text-sm font-bold">
              {copied === "link" ? "Link copied ✓" : "Copy link"}
            </button>
          </div>

          <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[
              { n: mine.friendsOrdered, label: mine.friendsOrdered === 1 ? "friend ordered" : "friends ordered" },
              { n: mine.earned, label: `${REFERRAL_REWARD.code} earned` },
              { n: mine.available, label: "ready to use" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-cream px-2 py-3">
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-2xl">{s.n}</dd>
                <dd className="text-xs font-semibold text-ink-soft">{s.label}</dd>
              </div>
            ))}
          </dl>
          {mine.available > 0 && mine.nextExpiry && (
            <p className="mt-4 rounded-2xl bg-sage/60 px-4 py-3 text-sm font-semibold">
              🎉 Enter <b>{REFERRAL_REWARD.code}</b> at checkout for {REFERRAL_REWARD.percent}% off
              {mine.available > 1 ? ` (you have ${mine.available}; one per order)` : ""}. Use it by {lastDay(mine.nextExpiry)}.
            </p>
          )}
        </>
      )}
    </section>
  );
}
