"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PROMO, shippingLine } from "@/lib/store";

const END = PROMO ? new Date(PROMO.endsAt).getTime() : 0;

/** "5h 12m", "42m", "1m": how long the offer has left. */
function left(ms: number) {
  const mins = Math.max(1, Math.ceil(ms / 60_000));
  const h = Math.floor(mins / 60);
  return h ? `${h}h ${mins % 60}m` : `${mins}m`;
}

/**
 * The thin strip above the menu. While an offer runs (PROMO in lib/store) the
 * same green strip scrolls the offer with a countdown; tapping it copies the
 * code. When the offer ends it goes back to the usual line by itself.
 */
export function OfferStrip() {
  // The clock starts after the page loads, so the server and browser render the
  // same first frame; until then the offer shows "today only" instead of a timer.
  const [now, setNow] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!PROMO) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const track = (
    <Link
      href="/track"
      className="absolute right-0 top-0 hidden h-full items-center bg-inherit px-6 underline decoration-paper/50 underline-offset-2 hover:decoration-paper md:flex"
    >
      Track order
    </Link>
  );

  // Saved pages carry the offer, so the first paint always shows it; once the
  // page has loaded the browser's own clock decides.
  const running = PROMO && (now === null || now < END);
  if (!PROMO || !running) {
    return (
      // One line on every screen: phones get the short version so it never wraps
      <div className="relative truncate bg-sage-deep px-4 py-1.5 text-center text-[0.6563rem] font-bold uppercase tracking-[0.12em] text-paper sm:text-[0.6875rem] sm:tracking-[0.14em]">
        <span className="hidden sm:inline">24×7 ordering available · </span>
        {shippingLine}
        <span className="sm:hidden"> · COD available</span>
        <span className="hidden lg:inline"> · Cash on Delivery</span>
        {track}
      </div>
    );
  }

  const ends = now === null ? "Today only, till 11:59 PM" : `Ends in ${left(END - now)}`;
  const items = [
    `🪔 ${PROMO.title}`,
    `${PROMO.percent}% off everything`,
    copied ? "Code copied ✓" : `Use code ${PROMO.code}`,
    ends,
    shippingLine,
    "Cash on Delivery",
  ];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROMO?.code ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="group relative overflow-hidden bg-sage-deep text-[0.6563rem] font-bold uppercase tracking-[0.12em] text-paper sm:text-[0.6875rem] sm:tracking-[0.14em]">
      <button
        type="button"
        onClick={copy}
        aria-label={`${PROMO.title}: ${PROMO.percent}% off everything with code ${PROMO.code}. ${ends}. Tap to copy the code.`}
        className="block w-full py-1.5 text-left uppercase"
      >
        <span className="anim-marquee flex w-max group-hover:[animation-play-state:paused]" style={{ animationDuration: "40s" }} aria-hidden>
          {[0, 1].map((k) => (
            <span key={k} className="flex shrink-0 whitespace-nowrap">
              {[...items, ...items].map((t, i) => (
                <span key={i} className="px-4">
                  {t}
                  <span className="pl-8 text-paper/60">✦</span>
                </span>
              ))}
            </span>
          ))}
        </span>
      </button>
      {track}
    </div>
  );
}
