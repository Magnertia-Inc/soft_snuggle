import Link from "next/link";
import { Reveal } from "../Reveal";
import { FlowerMark } from "../art/FlowerMark";

/**
 * The labels stocked at Soft Snuggle. Add to this list as more come in; the
 * row simply grows, and a single brand still reads as a deliberate choice
 * rather than a gap waiting to be filled.
 */
const BRANDS = [
  {
    name: "Veviba",
    blurb: "Soft cotton muslin, made for brand-new skin.",
    tint: "#F3E9DF",
    href: "/shop",
  },
];

export function Brands() {
  return (
    <section className="shell py-16 sm:py-20">
      <Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Our brands</p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            Labels we <em className="text-sage-deep">love</em>
          </h2>
          <p className="mt-3 max-w-md text-lg text-ink-soft">
            Chosen one at a time, for how they feel against new skin.
          </p>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BRANDS.map((b, i) => (
          <Reveal key={b.name} delay={i * 0.08}>
            <Link
              href={b.href}
              className="group flex h-full items-center gap-5 rounded-[1.75rem] p-7 transition-transform duration-500 hover:-translate-y-1.5"
              style={{ background: b.tint }}
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-paper">
                <FlowerMark className="h-7 w-7" />
              </span>
              <span>
                <span className="block font-display text-3xl tracking-tight">{b.name}</span>
                <span className="mt-1 block text-sm text-ink-soft">{b.blurb}</span>
                <span className="mt-3 inline-block text-sm font-bold underline-offset-4 group-hover:underline">
                  Shop {b.name} →
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
