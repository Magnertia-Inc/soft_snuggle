"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { Reveal } from "../Reveal";

const TEXT =
  "Soft, thoughtful baby essentials made for milk-drunk mornings, first wiggles and every cuddle in between. Gentle on their skin. Always.";

/** Words light up one by one as the paragraph scrolls through the viewport. */
export function Statement() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = TEXT.split(" ");

  return (
    <section className="mx-auto max-w-5xl px-6 py-28 sm:py-40">
      <Reveal className="mb-12 text-center">
        <p className="eyebrow">Made for their little beginnings</p>
        <h2 className="mt-4 font-display text-6xl leading-[0.95] tracking-tight sm:text-8xl">
          Small clothes. <em className="block text-sage-deep">Big cuddles.</em>
        </h2>
      </Reveal>
      <div className="mx-auto mb-12 h-px w-24 bg-line" />
      <div ref={ref} className="text-center font-display text-3xl leading-[1.18] tracking-tight sm:text-5xl lg:text-6xl">
        {words.map((w, i) => (
          <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
            {w}
          </Word>
        ))}
      </div>
    </section>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  const italic = ["milk-drunk", "wiggles", "cuddle", "Always."].includes(children);
  return (
    <motion.span style={{ opacity }} className={`mr-[0.25em] inline-block ${italic ? "italic text-sage-deep" : ""}`}>
      {children}
    </motion.span>
  );
}
