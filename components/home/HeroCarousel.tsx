"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { COLLECTIONS, type Collection } from "@/lib/collections";
import { Baby } from "../art/Baby";
import { FlowerMark } from "../art/FlowerMark";
import { useIntro } from "../providers/IntroProvider";

/** Slots per second the line of characters drifts by */
const GLIDE_SPEED = 0.22;

/** Signed distance of slide i from the centre position p, wrapped to [-n/2, n/2). */
function distance(i: number, p: number, n: number) {
  let d = (((i - p) % n) + n) % n;
  if (d >= n / 2) d -= n;
  return d;
}

function lerp(a: number, stops: number[], values: number[]) {
  if (a <= stops[0]) return values[0];
  for (let k = 1; k < stops.length; k++) {
    if (a <= stops[k]) {
      const t = (a - stops[k - 1]) / (stops[k] - stops[k - 1]);
      return values[k - 1] + (values[k] - values[k - 1]) * t;
    }
  }
  return values[values.length - 1];
}

export function HeroCarousel({ heroImages }: { heroImages: Record<string, string> }) {
  const { ready } = useIntro();
  const reduce = useReducedMotion();
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [spacing, setSpacing] = useState(300);
  const [compact, setCompact] = useState(false);
  const paused = useRef(false);
  const holdUntil = useRef(0);
  const speed = useRef(0);
  const pos = useMotionValue(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  // Only the pieces with a photographed cut-out in public/hero ride the
  // carousel: a drawing standing next to a photograph reads as a placeholder.
  // Drop a cut-out in and that slide appears on its own; nothing to edit here.
  const photographed = COLLECTIONS.filter((c) => heroImages[c.slug]);
  // If public/hero is ever empty the carousel would have nothing to centre on,
  // so fall back to the drawings rather than rendering an empty stage.
  const slides = photographed.length ? photographed : COLLECTIONS;
  const N = slides.length;
  const current = slides[Math.min(active, N - 1)];

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setSpacing(w < 640 ? w * 0.72 : Math.min(w * 0.21, 330));
      setCompact(w < 640);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Endless drift on a wide screen, where the characters read as a parade
  // passing by. A phone shows one at a time, so a constant drift means the
  // piece being looked at is almost never centred and is cropped at the edge
  // half the time. There it steps from one to the next and rests on each.
  useAnimationFrame((time, delta) => {
    if (compact) return;
    const goal = !ready || reduce || paused.current || performance.now() < holdUntil.current ? 0 : GLIDE_SPEED;
    speed.current += (goal - speed.current) * Math.min(1, delta / 450);
    if (Math.abs(speed.current) > 0.0005) pos.set(pos.get() + (speed.current * delta) / 1000);
  });

  useEffect(() => {
    if (!compact || !ready || reduce) return;
    const id = setInterval(() => {
      if (paused.current || performance.now() < holdUntil.current) return;
      stepRef.current(1);
    }, 4200);
    return () => clearInterval(id);
  }, [compact, ready, reduce]);

  useMotionValueEvent(pos, "change", (p) => {
    const idx = ((Math.round(p) % N) + N) % N;
    setActive((a) => (a === idx ? a : idx));
  });

  const glideTo = (target: number) => {
    holdUntil.current = performance.now() + 2600;
    speed.current = 0;
    animate(pos, target, { type: "spring", stiffness: 70, damping: 18 });
  };
  const step = (dir: 1 | -1) => glideTo(Math.round(pos.get()) + dir);
  const goToSlide = (i: number) => glideTo(pos.get() + distance(i, pos.get(), N));
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") stepRef.current(1);
      if (e.key === "ArrowLeft") stepRef.current(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Gentle mouse parallax on the backdrop
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const floatX = useTransform(sx, (v) => v * -26);
  const floatY = useTransform(sy, (v) => v * -18);

  // Hero sinks back as you scroll past it
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 0.88]);
  const stageY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="speckle relative h-[100svh] min-h-[40rem] overflow-hidden bg-cream"
      onPointerMove={(e) => {
        mx.set(e.clientX / window.innerWidth - 0.5);
        my.set(e.clientY / window.innerHeight - 0.5);
      }}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      {/* Colour glow that follows the centre character */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[60%] h-[85vmin] w-[85vmin] -translate-x-1/2 -translate-y-1/2 rounded-full [mask-image:radial-gradient(closest-side,#000_15%,transparent)]"
        animate={{ backgroundColor: current.glow }}
        transition={{ duration: 1.4 }}
      />

      {/* Giant collection word drifting behind */}
      <div className="pointer-events-none absolute inset-x-0 top-[44%] flex justify-center overflow-hidden md:top-[17%]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={current.slug}
            className="whitespace-nowrap font-display text-[13vw] leading-none tracking-tighter text-ink/[0.05] sm:text-[22vw] lg:text-[16vw]"
            initial={{ x: 160, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -160, opacity: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            {current.title} <em>{current.accent}</em>
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Floating petals */}
      <motion.div className="pointer-events-none absolute inset-0" style={{ x: floatX, y: floatY }}>
        {[
          ["7%", "30%", "#E6A99D", 0], ["90%", "24%", "#7F9C88", 1.2], ["80%", "74%", "#F1D47A", 0.6],
          ["14%", "80%", "#B7CCBE", 2, true], ["54%", "15%", "#D6B595", 1.6, false], ["30%", "20%", "#CFDFEC", 0.3, false],
        ].map(([left, top, color, delay, onPhone]) => (
          <div
            key={`${left}${top}`}
            className={`anim-float absolute ${onPhone === false ? "hidden sm:block" : ""}`}
            style={{ left: left as string, top: top as string, animationDelay: `${delay}s` }}
          >
            <FlowerMark className="h-5 w-5 opacity-70" petal={color as string} center="#FDFBF6" />
          </div>
        ))}
      </motion.div>

      <motion.div className="absolute inset-0" style={{ scale: stageScale, y: stageY, opacity: fade }}>
        {/* Mobile headline (desktop uses the side card) */}
        <div className="absolute inset-x-0 top-[14%] z-20 px-6 text-center md:hidden">
          <motion.p className="eyebrow" initial={{ opacity: 0, y: 16 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}>
            Made for their little beginnings
          </motion.p>
          <h1 className="mt-2 font-display text-4xl leading-[1.02] tracking-tight">
            {["Small clothes.", "Big cuddles."].map((line, i) => (
              <span key={line} className="block overflow-hidden pb-1">
                <motion.span
                  className={`block ${i === 1 ? "italic text-sage-deep" : ""}`}
                  initial={{ y: "105%" }}
                  animate={ready ? { y: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>
        </div>

        {/* Character line */}
        <motion.div
          ref={stageRef}
          className="absolute inset-x-0 bottom-[20%] top-[31%] z-10 cursor-grab touch-pan-y active:cursor-grabbing md:top-[15%] md:bottom-[19%]"
          initial={{ opacity: 0, y: 80 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ type: "spring", stiffness: 60, damping: 16, delay: 0.15 }}
          onHoverStart={() => (paused.current = true)}
          onHoverEnd={() => (paused.current = false)}
          onPanStart={() => (paused.current = true)}
          onPan={(_, info) => pos.set(pos.get() - info.delta.x / spacing)}
          onPanEnd={(_, info) => {
            paused.current = false;
            glideTo(Math.round(pos.get() - (info.velocity.x / spacing) * 0.35));
          }}
        >
          {slides.map((c, i) => (
            <GlideItem
              key={c.slug}
              collection={c}
              index={i}
              pos={pos}
              spacing={spacing}
              image={heroImages[c.slug]}
              compact={compact}
              count={N}
              onSelect={() => {
                const d = distance(i, pos.get(), N);
                if (Math.abs(d) < 0.5) router.push(`/product/${c.productSlug}`);
                else goToSlide(i);
              }}
            />
          ))}
        </motion.div>

        {/* Controls */}
        <motion.div
          className="absolute inset-x-0 bottom-[4%] z-30 flex flex-col items-center gap-3 px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9 }}
        >
          <Link href={`/product/${current.productSlug}`} className="btn-primary md:hidden">
            Shop {current.label} →
          </Link>
          <div className="flex items-center gap-4">
            <ArrowButton dir={-1} onClick={() => step(-1)} />
            <div className="flex items-center gap-1.5">
              {slides.map((c, i) => (
                <button
                  key={c.slug}
                  onClick={() => goToSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-8 bg-ink" : "w-1.5 bg-ink/20 hover:bg-ink/40"}`}
                  aria-label={`Go to ${c.label}`}
                />
              ))}
            </div>
            <ArrowButton dir={1} onClick={() => step(1)} />
          </div>

        </motion.div>
      </motion.div>
    </section>
  );
}

function GlideItem({
  collection,
  index,
  pos,
  spacing,
  image,
  compact,
  count,
  onSelect,
}: {
  collection: Collection;
  index: number;
  pos: MotionValue<number>;
  spacing: number;
  image?: string;
  compact: boolean;
  count: number;
  onSelect: () => void;
}) {
  const x = useTransform(pos, (p) => {
    const d = distance(index, p, count);
    const a = Math.abs(d);
    return Math.sign(d) * (Math.min(a, 1) * spacing + Math.max(a - 1, 0) * spacing * 0.78);
  });
  const scale = useTransform(pos, (p) => lerp(Math.abs(distance(index, p, count)), [0, 1, 2, 3], [1, 0.58, 0.42, 0.32]));
  // Neighbours fade out faster on a phone, where they would otherwise crowd
  // the piece being looked at.
  const opacity = useTransform(pos, (p) =>
    lerp(Math.abs(distance(index, p, count)), compact ? [0, 0.4, 0.8] : [0, 1.6, 2.4], [1, 0.3, 0]),
  );
  const zIndex = useTransform(pos, (p) => Math.round(100 - Math.abs(distance(index, p, count)) * 10));

  return (
    <motion.div className="absolute bottom-0 left-1/2 aspect-[220/320] h-full" style={{ x, opacity, zIndex }}>
      <div className="relative h-full w-full -translate-x-1/2">
        <motion.button
          type="button"
          onClick={onSelect}
          className="block h-full w-full origin-bottom"
          style={{ scale }}
          aria-label={collection.label}
        >
          {image ? (
            <img src={image} alt="" className="h-full w-full object-contain object-bottom mix-blend-multiply" draggable={false} />
          ) : (
            <Baby look={collection.look} className="h-full w-full" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

function ArrowButton({ dir, onClick }: { dir: 1 | -1; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 bg-paper/80 text-ink backdrop-blur transition-all hover:scale-105 hover:bg-ink hover:text-paper"
      aria-label={dir === 1 ? "Next" : "Previous"}
    >
      <svg viewBox="0 0 24 24" className={`h-4 w-4 ${dir === -1 ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  );
}
