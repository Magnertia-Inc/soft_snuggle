"use client";

import { AnimatePresence, motion } from "motion/react";
import { AGE_GROUPS, STORE, inr, shippingLine } from "@/lib/store";
import type { Category } from "@/lib/types";
import { Garment } from "../art/Garment";
import { FlowerMark } from "../art/FlowerMark";

const BANNERS: Record<string, { eyebrow: string; title: string; accent: string; body: string; tint: string; perks: string[]; art: { category: Category; color: string }[] }> = {
  all: {
    eyebrow: "The whole collection",
    title: "All the",
    accent: "little things",
    body: "Frocks, jablas, nappies, sets and gift packs for every new chapter.",
    tint: "#DFE7DD",
    perks: ["Soft cotton", shippingLine, "Cash on Delivery"],
    art: [
      { category: "jabla", color: "#F3EBC4" },
      { category: "frock", color: "#F4D9D6" },
      { category: "gift-set", color: "#CFDCCB" },
    ],
  },
  frock: {
    eyebrow: "Twirl-ready",
    title: "Little",
    accent: "frocks",
    body: "Soft, breezy frocks with gathered skirts and easy snap backs, made for twirls and tummy time.",
    tint: "#F6EFD3",
    perks: ["Breathable muslin", "Snap back", "Sizes 0–12 months"],
    art: [
      { category: "frock", color: "#F3EBC4" },
      { category: "frock", color: "#F4D9D6" },
      { category: "frock", color: "#CFDFEC" },
    ],
  },
  jabla: {
    eyebrow: "Everyday comfort",
    title: "Soft",
    accent: "jablas",
    body: "Classic sleeveless jablas with snap fronts. Cool, easy and gentle on tiny skin.",
    tint: "#F3EBD6",
    perks: ["Breathable muslin", "Front snaps", "Sizes 0–12 months"],
    art: [
      { category: "jabla", color: "#F3EBC4" },
      { category: "jabla", color: "#C9D8C5" },
      { category: "jabla", color: "#F4EEE4" },
    ],
  },
  bodysuit: {
    eyebrow: "Everyday essentials",
    title: "Easy-snap",
    accent: "bodysuits",
    body: "Envelope shoulders and nickel-free snaps for the many, many changes.",
    tint: "#E3EAE0",
    perks: ["Envelope neck", "Tagless", "Organic options"],
    art: [
      { category: "bodysuit", color: "#CFDFEC" },
      { category: "bodysuit", color: "#F4EEE4" },
      { category: "bodysuit", color: "#F4D9D6" },
    ],
  },
  romper: {
    eyebrow: "For wigglers",
    title: "Rompers that",
    accent: "keep up",
    body: "Stretchy, breezy one-pieces for crawling, cruising and first steps.",
    tint: "#F3E2D6",
    perks: ["Full snap front", "Stretch jersey", "Room to grow"],
    art: [
      { category: "romper", color: "#B7CCBE" },
      { category: "romper", color: "#D9B994" },
      { category: "romper", color: "#F4D9D6" },
    ],
  },
  "gift-set": {
    eyebrow: "Wrapped with love",
    title: "Gifts, ready",
    accent: "to give",
    body: "Keepsake-boxed sets for baby showers, first visits and welcome-home days.",
    tint: "#F3E5E4",
    perks: ["Keepsake box", "Handwritten note", "Ribbon-wrapped"],
    art: [
      { category: "gift-set", color: "#CFDCCB" },
      { category: "gift-set", color: "#F2D6CC" },
      { category: "gift-set", color: "#F1E7BC" },
    ],
  },
  organic: {
    eyebrow: "Kind to tiny skin",
    title: "Organic",
    accent: "cotton",
    body: "Certified organic cotton that breathes, and only gets softer with every wash.",
    tint: "#E6EDE1",
    perks: ["Breathable", "No harsh dyes", "Softer every wash"],
    art: [
      { category: "bodysuit", color: "#C9D8C5" },
      { category: "gift-set", color: "#CFDCCB" },
      { category: "bodysuit", color: "#F4EEE4" },
    ],
  },
};

export function ShopBanner({ tab, age, photos = [] }: { tab: string; age: string; photos?: string[] }) {
  const b = BANNERS[tab] ?? BANNERS.all;
  const group = AGE_GROUPS.find((g) => g.slug === age);
  const key = `${tab}-${age}`;

  return (
    <motion.div
      className="relative mb-8 overflow-hidden rounded-[1.75rem] px-5 py-7 sm:mb-10 sm:rounded-[2.25rem] sm:px-12 sm:py-14"
      animate={{ backgroundColor: group?.tint ?? b.tint }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="pointer-events-none absolute -right-10 -top-10 opacity-40"
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      >
        <FlowerMark className="h-32 w-32 sm:h-56 sm:w-56" petal="#FDFBF6" center="#FDFBF6" />
      </motion.div>

      <div className="relative grid items-center gap-6 sm:gap-8 md:grid-cols-[1.2fr_1fr]">
        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow">{group ? group.range : b.eyebrow}</p>
            <h1 className="mt-2 font-display text-[2.1rem] leading-[1] tracking-tight sm:mt-3 sm:text-6xl">
              {group ? (
                <>
                  For your <em className="text-sage-deep">{group.title.toLowerCase()}</em>
                </>
              ) : (
                <>
                  {b.title} <em className="text-sage-deep">{b.accent}</em>
                </>
              )}
            </h1>
            <p className="mt-2.5 max-w-md text-sm text-ink-soft sm:mt-4 sm:text-base">{b.body}</p>
            <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-6 sm:gap-2">
              {b.perks.map((p) => (
                <span key={p} className="rounded-full bg-paper/80 px-3 py-1 text-[0.6875rem] font-bold sm:px-3.5 sm:py-1.5 sm:text-xs">
                  ✿ {p}
                </span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="relative hidden h-64 md:block">
          {/* The pieces hang from a line with little pegs, the same motif the
              loading screen uses, rather than standing in a row. The line is
              drawn across the full width and each garment is hung at the
              height the curve reaches at its own position. */}
          {photos.length > 0 && (
            <svg
              viewBox="0 0 400 60"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-x-0 top-0 h-[3.75rem] w-full overflow-visible"
              aria-hidden="true"
            >
              <motion.path
                d="M -30 16 Q 200 46 430 16"
                fill="none"
                stroke="#C3B49C"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
              />
            </svg>
          )}

          <AnimatePresence mode="popLayout">
            {(photos.length ? photos : b.art).map((a, i) => (
              <motion.div
                key={`${tab}-${i}`}
                className={`absolute ${photos.length ? "top-0" : "top-1/2"} ${
                  photos.length ? "w-[29%]" : "w-[36%]"
                }`}
                style={{
                  // Hung at the point the curve has reached, so the pegs sit
                  // on the line rather than near it.
                  left: photos.length ? `${[2, 35, 68][i] ?? i * 33}%` : `${i * 31}%`,
                  top: photos.length ? [26, 40, 26][i] ?? 30 : undefined,
                }}
                initial={{ opacity: 0, y: -60, rotate: -14 }}
                // Dropped onto the line, swinging to a slight resting angle.
                animate={{ opacity: 1, y: 0, rotate: [-14, 8, -4, 2, [-3, 1, 3][i] ?? 0] }}
                exit={{ opacity: 0, y: -30 }}
                // The drop uses a spring, but a spring only accepts two
                // keyframes, so the multi-step swing gets a tween of its own.
                transition={{
                  delay: i * 0.1,
                  type: "spring",
                  stiffness: 130,
                  damping: 12,
                  rotate: { delay: i * 0.1, duration: 1.2, ease: "easeOut" },
                }}
              >
                {typeof a === "string" ? (
                  <div className="anim-float origin-top" style={{ animationDelay: `${i * 0.7}s` }}>
                    <span className="mx-auto block h-4 w-[0.4375rem] -translate-y-2 rounded-sm bg-[#C9A27A] shadow-[inset_-1px_0_0_rgba(0,0,0,0.15)]" />
                    <img
                      src={a}
                      alt=""
                      draggable={false}
                      className="relative -z-10 -mt-2 max-h-48 w-full object-contain object-top [filter:drop-shadow(0_14px_16px_rgba(60,50,40,0.2))]"
                    />
                  </div>
                ) : (
                  <div className="anim-float" style={{ animationDelay: `${i * 0.6}s` }}>
                    <Garment category={a.category} color={a.color} className="w-full" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
