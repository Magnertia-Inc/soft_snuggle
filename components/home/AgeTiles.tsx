"use client";

import Link from "next/link";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AGE_GROUPS } from "@/lib/store";
import { AGE_LOOKS } from "@/lib/collections";
import { Baby } from "../art/Baby";
import { OutfitSwatches } from "../art/OutfitSwatches";

const LOOKS = AGE_LOOKS;
const NOTES = [
  "Snug, gentle firsts for the fourth trimester.",
  "Easy snaps for the many, many changes.",
  "Comfy fits for rolling over and sitting up tall.",
  "Stretchy pieces for crawling, cruising and first steps.",
  "Room to run, climb and grow, all the way to three.",
];

/** Vertical scroll drives a horizontal ride through the age groups. */
export function AgeTiles({
  counts,
  photos = {},
}: {
  counts: Record<string, number>;
  /** Real baby photos by age-group slug; a card without one keeps its drawing. */
  photos?: Record<string, string>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  // Phones get a plain stack instead of the sideways ride. Taking over the
  // scroll works with a mouse wheel, but on a touch screen it fights the
  // flick people already know, and the whole section ran to two and a half
  // screens before you could get past it.
  const [stacked, setStacked] = useState(false);
  // Each card dresses its own baby, so trying a colour on one leaves the
  // others as they were.
  const [outfits, setOutfits] = useState<Record<number, string>>({});
  const [vh, setVh] = useState(800);

  useEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      setDistance(Math.max(0, trackRef.current.scrollWidth - window.innerWidth));
      setVh(window.innerHeight);
      setStacked(window.innerWidth < 768);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const rawX = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const x = useSpring(rawX, { stiffness: 120, damping: 30, mass: 0.4 });
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const card = (g: (typeof AGE_GROUPS)[number], i: number) => ({
    swatches: !photos[g.slug] && (
      <OutfitSwatches
        className="relative z-20 mt-4"
        value={outfits[i] ?? LOOKS[i % LOOKS.length].outfit}
        onPick={(hex) => setOutfits((o) => ({ ...o, [i]: hex }))}
      />
    ),
    figure: photos[g.slug] ? (
      <img src={photos[g.slug]} alt="" className="h-full w-auto object-contain object-bottom" draggable={false} />
    ) : (
      <Baby look={{ ...LOOKS[i % LOOKS.length], outfit: outfits[i] ?? LOOKS[i % LOOKS.length].outfit }} className="h-full w-full" />
    ),
  });

  if (stacked) {
    return (
      <section id="shop-by-age" className="px-4 py-16">
        <p className="eyebrow">Shop by age</p>
        <h2 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight">
          A fit for every <em className="text-sage-deep">little leap</em>
        </h2>
        <p className="mt-3 text-ink-soft">Comfy favourites for every new chapter.</p>

        <div className="mt-7 space-y-4">
          {AGE_GROUPS.map((g, i) => {
            const { swatches, figure } = card(g, i);
            return (
              <div key={g.slug} className="overflow-hidden rounded-[1.75rem] p-5" style={{ background: g.tint }}>
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-3xl tracking-tight">{g.title}</h3>
                    </div>
                    <p className="mt-0.5 text-[0.6875rem] font-extrabold uppercase tracking-[0.18em] text-ink/60">{g.range}</p>
                    <p className="mt-2 text-sm text-ink-soft">{NOTES[i]}</p>
                    <Link
                      href={`/shop?age=${g.slug}`}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-paper"
                    >
                      {g.slug === "toddler" ? "Shop Toddlers" : `Shop ${g.title}`} <span aria-hidden>→</span>
                    </Link>
                  </div>
                  {/* The figure keeps its own column so the text never wraps around it */}
                  <div className={`shrink-0 self-end ${photos[g.slug] ? "w-[40%] max-h-[13.125rem]" : "aspect-[220/320] w-[29%]"}`}>
                    {figure}
                  </div>
                </div>
                {swatches}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section id="shop-by-age" ref={sectionRef} className="relative" style={{ height: distance + vh }}>
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <motion.div ref={trackRef} className="flex w-max items-stretch gap-5 px-6 sm:gap-8 sm:px-12" style={{ x }}>
          <div className="flex w-[78vw] shrink-0 flex-col justify-center sm:w-[40vw] lg:w-[30vw]">
            <p className="eyebrow">Shop by age</p>
            <h2 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              A fit for every <em className="text-sage-deep">little leap</em>
            </h2>
            <p className="mt-5 max-w-sm text-lg text-ink-soft">Comfy favourites for every new chapter. Keep scrolling to meet them all →</p>
            <div className="mt-8 h-1 w-40 overflow-hidden rounded-full bg-line">
              <motion.div className="h-full bg-ink" style={{ width: bar }} />
            </div>
          </div>

          {AGE_GROUPS.map((g, i) => (
            <Link
              key={g.slug}
              href={`/shop?age=${g.slug}`}
              className="group relative flex h-[64svh] w-[78vw] lg:h-[72svh] shrink-0 flex-col overflow-hidden rounded-[2.25rem] p-7 sm:w-[46vw] sm:p-9 lg:w-[34vw]"
              style={{ background: g.tint }}
            >
              <div className="flex items-start justify-between">
                <span className="font-display text-lg text-ink/50">0{i + 1}</span>
              </div>
              <div className="relative z-10 mt-2">
                <h3 className="font-display text-5xl tracking-tight sm:text-6xl lg:text-5xl xl:text-6xl">{g.title}</h3>
                <p className="mt-1 text-sm font-extrabold uppercase tracking-[0.2em] text-ink/60">{g.range}</p>
                <p className="mt-3 max-w-[16rem] text-ink-soft">{NOTES[i]}</p>
              </div>
              <span className="relative z-10 mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-paper transition-all group-hover:gap-4">
                {g.slug === "toddler" ? "Shop Toddlers" : `Shop ${g.title}`} <span aria-hidden>→</span>
              </span>

              {/* Only the drawn babies can be dressed: recolouring a photo of
                  the real garment would show a shade that is not for sale. */}
              {!photos[g.slug] && (
                <OutfitSwatches
                  className="relative z-20 mt-4"
                  value={outfits[i] ?? LOOKS[i % LOOKS.length].outfit}
                  onPick={(hex) => setOutfits((o) => ({ ...o, [i]: hex }))}
                />
              )}
              {/* The baby gets whatever height is left below the button, so the two never overlap */}
              <div className="pointer-events-none -mb-4 mt-2 flex min-h-0 flex-1 items-end justify-end">
                <div
                  className={`h-full transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-3 group-hover:rotate-[-4deg] ${
                    photos[g.slug] ? "max-h-[27.5rem]" : "aspect-[220/320] max-h-[18.75rem]"
                  }`}
                >
                  {photos[g.slug] ? (
                    <img
                      src={photos[g.slug]}
                      alt=""
                      className="h-full w-auto object-contain object-bottom"
                      draggable={false}
                    />
                  ) : (
                    <Baby look={{ ...LOOKS[i % LOOKS.length], outfit: outfits[i] ?? LOOKS[i % LOOKS.length].outfit }} className="h-full w-full" />
                  )}
                </div>
              </div>
            </Link>
          ))}
          <div className="w-2 shrink-0" />
        </motion.div>
      </div>
    </section>
  );
}
