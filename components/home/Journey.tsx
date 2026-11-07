"use client";

import { motion } from "motion/react";
import { Reveal } from "../Reveal";

// "Why us?": Veviba is order to make. Every piece is stitched fresh for the
// child it's going to, and this is the 7-day journey from order to doorstep.
// Wide screens: the days zig-zag along a wavy stitched thread.
// Phones: one neat card with the days listed in order.

const STEPS = [
  { title: "Order received", body: "Your order lands with us, any hour.", tint: "#DFE7DD", emoji: "🛍️" },
  { title: "Fabrics selected", body: "Soft 100% cotton, chosen by hand.", tint: "#F3D8C8", emoji: "🧵" },
  { title: "Stitching starts", body: "Cut and sewn fresh, just for you.", tint: "#F1E7BC", emoji: "🪡" },
  { title: "Finishing", body: "Seams checked, threads trimmed.", tint: "#DCE6EE", emoji: "✨" },
  { title: "Packaging", body: "Folded with care, wrapped like a gift.", tint: "#DFE7DD", emoji: "🎁" },
  { title: "In transit", body: "On its way to you, tracked.", tint: "#F3D8C8", emoji: "🚚" },
  { title: "Delivered", body: "At your door, ready for cuddles.", tint: "#F1E7BC", emoji: "🏡" },
];

// Thread geometry for the wide layout (viewBox 700 x 300): stops alternate
// low and high, so labels sit above the high ones and below the low ones.
const W = 700;
const HIGH = 110;
const LOW = 190;
const pts = STEPS.map((_, i) => ({ x: (i + 0.5) * (W / STEPS.length), y: i % 2 ? HIGH : LOW }));
const thread = pts.reduce((d, p, i) => {
  if (i === 0) return `M ${p.x} ${p.y}`;
  const prev = pts[i - 1];
  const mid = (prev.x + p.x) / 2;
  return `${d} C ${mid} ${prev.y}, ${mid} ${p.y}, ${p.x} ${p.y}`;
}, "");

const ease = [0.22, 1, 0.36, 1] as const;

export function Journey() {
  return (
    <section id="why-us" className="shell py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Why us?</p>
        <h2 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
          Order to <em className="text-sage-deep">make</em>
        </h2>
        <p className="mt-4 text-base text-ink-soft sm:text-lg">
          Specially made for your little one. We stitch every piece fresh, once you order, and it reaches you in 7 days.
        </p>
      </Reveal>

      {/* ── Wide screens: the stitched-thread roadmap ── */}
      {/* The 7-day chart sits in its own bordered panel */}
      <div className="mx-auto mt-10 hidden max-w-6xl rounded-[2rem] border-2 border-line bg-paper px-8 pb-16 pt-20 shadow-[0_18px_40px_-28px_rgba(38,59,54,0.4)] lg:block">
      <div className="relative h-[19rem]">
        {/* The whole thread is always drawn end to end; it's revealed left to
            right as the section scrolls in, so it can never stop part-way. */}
        <motion.svg
          viewBox={`0 0 ${W} 300`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          whileInView={{ clipPath: "inset(0 0% 0 0)" }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 2.2, ease }}
        >
          <path
            d={thread}
            fill="none"
            stroke="#7F9C88"
            strokeWidth={2}
            strokeDasharray="7 7"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </motion.svg>

        {STEPS.map((s, i) => {
          const p = pts[i];
          const high = p.y === HIGH;
          return (
            <motion.div
              key={s.title}
              className="absolute w-[9.5rem] -translate-x-1/2 text-center"
              style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / 300) * 100}%` }}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.6, delay: 0.25 + i * 0.22, ease }}
            >
              {/* the stop itself, centred on the thread */}
              <div
                className="absolute left-1/2 top-0 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border-4 border-cream text-2xl shadow-[0_8px_20px_-10px_rgba(38,59,54,0.45)]"
                style={{ background: s.tint, rotate: i % 2 ? "6deg" : "-6deg" }}
              >
                <span style={{ rotate: i % 2 ? "-6deg" : "6deg" }}>{s.emoji}</span>
              </div>
              {/* label above the high stops, below the low ones */}
              <div className={`absolute inset-x-0 ${high ? "bottom-10" : "top-10"}`}>
                <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-sage-deep">Day {i + 1}</p>
                <p className="mt-0.5 font-display text-lg leading-tight tracking-tight">{s.title}</p>
                <p className="mt-1 text-xs leading-snug text-ink-soft">{s.body}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
      </div>

      {/* ── Phones and tablets: one neat card ── */}
      <Reveal className="mx-auto mt-10 max-w-md lg:hidden">
        <ol className="overflow-hidden rounded-[1.75rem] border border-line bg-paper">
          {STEPS.map((s, i) => (
            <li key={s.title} className={`flex items-center gap-4 px-5 py-4 ${i ? "border-t border-line" : ""}`}>
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl"
                style={{ background: s.tint }}
                aria-hidden
              >
                {s.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-tight">{s.title}</p>
                <p className="mt-0.5 text-sm text-ink-soft">{s.body}</p>
              </div>
              <span className="shrink-0 rounded-full bg-cream px-2.5 py-1 text-xs font-extrabold text-sage-deep">
                Day {i + 1}
              </span>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal className="mt-10 text-center lg:mt-6" delay={0.2}>
        <p className="font-display text-2xl tracking-tight sm:text-3xl">
          Ordered today, <em className="text-sage-deep">cuddled in a week.</em>
        </p>
      </Reveal>
    </section>
  );
}
