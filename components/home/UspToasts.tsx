"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { STORE } from "@/lib/store";

const USPS: { icon: string; title: string; text: string; bg: string; href?: string }[] = [
  { icon: "🧵", title: "100% pure cotton", text: "Soft, breathable and kind to tiny skin.", bg: "#E4EFE7" },
  { icon: "✂️", title: "Made just for you", text: "Stitched fresh after you order — never old stock.", bg: "#FCEFD9" },
  { icon: "🚚", title: "At your door in 7 days", text: "Stitched, checked and shipped with love.", bg: "#E3EEF8" },
  { icon: "↩️", title: "7-day easy returns", text: "Not the right fit? Send it back, no fuss.", bg: "#F8E4E8" },
  { icon: "🎁", title: "Coupons on every purchase", text: "Join our WhatsApp channel to get them first.", bg: "#DDF5E5", href: STORE.whatsappChannel },
];

const KEY = "veviba-usp-seen";

/** Small rotating USP cards, bottom-left on the home page. Shown once per visit. */
export function UspToasts() {
  const [i, setI] = useState(-1);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return;
    } catch {}
    // Mark as seen only when the first card actually appears, so a remount
    // (page change, dev reload) before then doesn't swallow it.
    const start = setTimeout(() => {
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {}
      setI(0);
    }, 4000);
    return () => clearTimeout(start);
  }, []);

  useEffect(() => {
    if (i < 0 || i >= USPS.length) return;
    const t = setTimeout(() => setI((n) => n + 1), 5000);
    return () => clearTimeout(t);
  }, [i]);

  const u = USPS[i];
  return (
    <div className="pointer-events-none fixed bottom-5 left-4 z-40 w-[calc(100vw-6.5rem)] max-w-[20rem] sm:left-6">
      <AnimatePresence mode="wait">
        {u && (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -60, rotate: -3 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="pointer-events-auto relative overflow-hidden rounded-3xl border-2 border-dashed border-ink/15 p-4 pr-10 shadow-xl"
            style={{ background: u.bg }}
            role="status"
          >
            <p className="mb-2 text-[0.625rem] font-extrabold uppercase tracking-[0.2em] text-ink/50">
              Why Veviba · {i + 1}/{USPS.length}
            </p>
            <div className="flex items-center gap-3">
              <motion.span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-paper text-2xl shadow"
                initial={{ scale: 0.4, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
              >
                {u.icon}
              </motion.span>
              <div className="min-w-0">
                <p className="font-display text-lg leading-tight text-ink">{u.title}</p>
                <p className="mt-0.5 text-sm text-ink-soft">{u.text}</p>
              </div>
            </div>
            {u.href && (
              <a href={u.href} target="_blank" rel="noreferrer" className="mt-3 block rounded-full bg-[#25D366] py-2 text-center text-sm font-bold text-white hover:bg-[#1da851]">
                Join WhatsApp channel →
              </a>
            )}
            <button onClick={() => setI(USPS.length)} aria-label="Close" className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-paper/70 text-xs text-ink-soft hover:bg-paper">
              ✕
            </button>
            {/* time bar */}
            <motion.span
              className="absolute bottom-0 left-0 h-1 bg-ink/25"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
