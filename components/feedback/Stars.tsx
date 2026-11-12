"use client";

import { useState } from "react";

export const STAR_WORDS = ["", "Poor", "Could be better", "Okay", "Good", "Excellent"];

/** Five tappable stars, read by screen readers as a 1–5 choice. */
export function StarPicker({
  value,
  onChange,
  label,
  big = false,
  words = true,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
  big?: boolean;
  words?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label={label} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${label}: ${n} ${n === 1 ? "star" : "stars"}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          className={`leading-none transition-transform hover:scale-110 ${big ? "px-0.5 text-[2.6rem] sm:text-5xl" : "px-px text-[1.7rem]"} ${
            n <= shown ? "text-[#E0A526]" : "text-line"
          }`}
        >
          ★
        </button>
      ))}
      {words && <span className={`ml-2 font-bold text-ink-soft ${big ? "text-sm" : "text-xs"}`}>{STAR_WORDS[shown]}</span>}
    </div>
  );
}

/** Stars for reading, e.g. on a review. */
export function StarsShow({ rating, className = "" }: { rating: number; className?: string }) {
  const full = Math.round(rating);
  return (
    <span className={`tracking-[0.12em] text-[#E0A526] ${className}`} aria-label={`${rating.toFixed(rating % 1 ? 1 : 0)} out of 5 stars`}>
      {"★".repeat(full)}
      <span className="text-line">{"★".repeat(5 - full)}</span>
    </span>
  );
}

/** The thank-you code, with a copy button. */
export function RewardCode({ code, percent, phone, until, title }: { code: string; percent: number; phone: string; until: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div className="rounded-2xl bg-sage/60 p-5">
      <p className="text-sm font-bold">{title}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="rounded-xl border-2 border-dashed border-ink/50 bg-paper px-4 py-2 font-mono text-2xl font-bold tracking-[0.2em]">{code}</span>
        <button type="button" onClick={copy} className="rounded-full bg-paper px-4 py-2 text-sm font-bold">
          {copied ? "Copied ✓" : "Copy code"}
        </button>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        {percent}% off your next order. Enter it at checkout with this mobile number (+91 {phone}) by{" "}
        <b className="text-ink">{until}</b>. Works once; one code per order.
      </p>
    </div>
  );
}

export const lastDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
