"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Category } from "@/lib/types";
import { Garment } from "./art/Garment";
import { Logo } from "./art/Logo";
import { useIntro } from "./providers/IntroProvider";

// Little clothes pegged along a washing line. x/y are positions on the
// 800×260 line drawing; y follows the curve of the string.
const LINE: { x: number; y: number; category: Category; color: string }[] = [
  { x: 150, y: 96, category: "bodysuit", color: "#F4EEE4" },
  { x: 275, y: 106, category: "romper", color: "#F4D9D6" },
  { x: 400, y: 110, category: "bodysuit", color: "#CFDFEC" },
  { x: 525, y: 106, category: "romper", color: "#D9B994" },
  { x: 650, y: 96, category: "bodysuit", color: "#C9D8C5" },
];

const NOTES = ["Washing tiny socks", "Pegging the onesies", "Fluffing the cotton", "Almost dry"];

export function Loader() {
  const { setReady } = useIntro();
  const lenis = useLenis();
  // The intro only plays when someone lands on the home page.
  const [visible, setVisible] = useState(usePathname() === "/");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) {
      setReady(true);
      return;
    }
    // About 1.7 s on screen: 1.4 s of loading plus a short pause before it lifts.
    // (globals.css also hides it after 3 s on its own, in case this script is
    // slow to start or never runs, so nobody is ever left on a blank screen.)
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setProgress(Math.round((1 - Math.pow(1 - t, 2.4)) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // A plain timer ends the intro, so it lifts on time even if frames are throttled
    const timers = [
      setTimeout(() => {
        setProgress(100);
        setVisible(false);
      }, duration + 300),
      // Fallback in case the exit animation never reports back (e.g. hidden tab)
      setTimeout(() => setReady(true), duration + 1500),
    ];
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!lenis) return;
    if (visible) lenis.stop();
    else lenis.start();
  }, [lenis, visible]);

  return (
    <AnimatePresence onExitComplete={() => setReady(true)}>
      {visible && (
        <motion.div
          key="loader"
          className="loader-failsafe speckle fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-cream"
          exit={{ y: "-100%", borderBottomLeftRadius: "50% 120px", borderBottomRightRadius: "50% 120px" }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* Washing line */}
          <div className="relative aspect-[800/260] w-[min(132vw,920px)]">
            <svg viewBox="0 0 800 260" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
              <motion.path
                d="M -60 66 Q 400 154 860 66"
                fill="none"
                stroke="#B8A58C"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
              />
            </svg>
            {LINE.map((g, i) => (
              <motion.div
                key={i}
                className="absolute w-[18%] origin-top"
                style={{ left: `${(g.x / 800) * 100}%`, top: `${(g.y / 260) * 100}%`, x: "-50%" }}
                initial={{ y: -420, rotate: -25 }}
                animate={{ y: 0, rotate: [-25, 14, -8, 5, -2, 0] }}
                exit={{ y: -120, opacity: 0, transition: { delay: i * 0.04, duration: 0.4 } }}
                transition={{
                  y: { type: "spring", stiffness: 140, damping: 13, delay: 0.25 + i * 0.08 },
                  rotate: { duration: 1.2, ease: "easeOut", delay: 0.25 + i * 0.08 },
                }}
              >
                <motion.div
                  className="origin-top"
                  animate={{ rotate: [0, 3, -3, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 2 + i * 0.2 }}
                >
                  <span className="mx-auto block h-4 w-2 -translate-y-1.5 rounded-sm bg-[#C9A27A] shadow-[inset_-1px_0_0_rgba(0,0,0,0.15)]" />
                  <Garment category={g.category} color={g.color} className="relative -z-10 mt-[-28%] w-full" />
                </motion.div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Logo className="mx-auto h-16 sm:h-20" />
            <p className="eyebrow mt-2">Little clothes, lots of love</p>
          </motion.div>

          <div className="absolute bottom-10 left-1/2 w-[min(280px,70vw)] -translate-x-1/2 text-center">
            <p className="mb-2 font-display text-sm italic text-ink-soft">
              {NOTES[Math.min(NOTES.length - 1, Math.floor(progress / 26))]}…
            </p>
            <div className="h-[3px] overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-sage-deep" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs font-extrabold tabular-nums tracking-widest text-ink-soft">{progress}%</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
