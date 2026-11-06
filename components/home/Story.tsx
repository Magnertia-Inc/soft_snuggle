"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { lookFor } from "@/lib/collections";
import { Baby } from "../art/Baby";
import { FlowerMark } from "../art/FlowerMark";
import { Reveal } from "../Reveal";

const VALUES = [
  { n: "01", title: "Gentle fabrics", body: "Soft cotton selected with delicate skin in mind.", tint: "#DFE7DD" },
  { n: "02", title: "Easy little details", body: "Comfy fits that make getting dressed simpler.", tint: "#F3D8C8" },
  { n: "03", title: "Made to pass along", body: "Thoughtful quality for keeping and sharing.", tint: "#DCE6EE" },
];

/** heading: "h1" where the story is the page itself (About); on the home page it's a section, so h2. */
export function Story({ photo, heading: Heading = "h2" }: { photo?: string; heading?: "h1" | "h2" }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // A photograph fills its box edge to edge, where the drawing carries its own
  // padding. The full parallax travel lifted a real baby's head out through the
  // top of the card, so a photo drifts less far.
  const babyY = useTransform(scrollYProgress, [0, 1], photo ? [44, -44] : [80, -80]);
  const cloudY = useTransform(scrollYProgress, [0, 1], [40, -30]);
  // The tilt gives the drawing some life; on a photograph it just looks like a
  // crooked crop, so it is softened.
  const rotate = useTransform(scrollYProgress, [0, 1], photo ? [-2, 2] : [-6, 6]);

  return (
    <section id="story" className="shell py-24 sm:py-32">
      <div ref={ref} className="relative grid overflow-hidden rounded-[2.5rem] bg-sage lg:grid-cols-2">
        <div className="relative z-10 p-8 sm:p-14 lg:p-20">
          <Reveal>
            <p className="eyebrow">A softer kind of start</p>
            <Heading className="mt-4 font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl">
              Made with love. <em className="text-sage-deep">Made to be loved.</em>
            </Heading>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
              We believe the first things they wear should feel like a little hug. Thoughtful fabrics, fuss-free details
              and pieces worth keeping close — then passing along to the next little one.
            </p>
          </Reveal>
        </div>

        <div className="relative h-[26.25rem] lg:h-auto lg:min-h-[35rem]">
          <motion.div className="absolute bottom-10 left-1/2 h-[46%] w-[78%] -translate-x-1/2 rounded-[50%] bg-[#C5D4C3]" style={{ y: cloudY }} />
          <motion.div
            className={`absolute left-1/2 aspect-[220/320] -translate-x-1/2 ${
              photo ? "bottom-10 h-[70%]" : "bottom-16 h-[78%]"
            }`}
            style={{ y: babyY, rotate }}
          >
            {photo ? (
              <img src={photo} alt="" className="h-full w-full object-contain object-bottom" draggable={false} />
            ) : (
              <Baby look={lookFor("bloom")} className="h-full w-full" />
            )}
          </motion.div>
          {[["12%", "18%"], ["78%", "26%"], ["70%", "70%"]].map(([l, t], i) => (
            <div key={i} className="anim-float absolute" style={{ left: l, top: t, animationDelay: `${i * 0.8}s` }}>
              <FlowerMark className="h-7 w-7" petal="#FDFBF6" />
            </div>
          ))}
        </div>
      </div>

      {/* Our promise. This spot held a customer quote; put one back only when
          it is a real review shared with the customer's permission. */}
      <Reveal className="mx-auto mt-24 max-w-4xl text-center sm:mt-32">
        <p className="eyebrow">Our little promise</p>
        <p className="relative mt-6 font-display text-2xl leading-snug tracking-tight sm:text-[2.6rem]">
          Every piece is chosen by hand for how it feels against brand-new skin, and if the size isn&apos;t right,
          we&apos;ll <em className="text-sage-deep">happily exchange it within 7 days.</em>
        </p>
      </Reveal>

      {/* Values */}
      <div className="mt-14 grid gap-3 sm:mt-32 sm:gap-5 md:grid-cols-3">
        {VALUES.map((v, i) => (
          <Reveal key={v.n} delay={i * 0.12}>
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="h-full rounded-[1.75rem] border border-line bg-paper p-5 sm:p-8"
            >
              <div className="flex items-center gap-3 md:block">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-display text-lg sm:h-14 sm:w-14 sm:text-xl"
                  style={{ background: v.tint }}
                >
                  {v.n}
                </span>
                <h3 className="font-display text-xl tracking-tight sm:text-2xl md:mt-6">{v.title}</h3>
              </div>
              <p className="mt-2 text-sm text-ink-soft sm:text-base">{v.body}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
