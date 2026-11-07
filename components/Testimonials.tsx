import { Reveal } from "./Reveal";

// Parent reviews, shown as cards that glide slowly across the screen (they
// pause while someone hovers over them to read).
//
// Put only REAL reviews here, in the parent's own words and with their
// permission. Invented reviews mislead buyers and are against India's
// consumer protection rules.

type Review = { title: string; quote: string; name: string; detail: string };

const REVIEWS: Review[] = [
  {
    title: "So soft and comfy ❤️",
    quote: "The fabric is incredibly soft, and my baby looks so cute in her new dress! Absolutely loved the quality.",
    name: "Anitha",
    detail: "Mum to a baby boy",
  },
  {
    title: "Just adorable!",
    quote: "Such a pretty little outfit! The colours are lovely, and the fit is perfect for my princess.",
    name: "Suguna",
    detail: "Mum to a baby girl",
  },
  {
    title: "Loved every detail!",
    quote: "Beautiful prints and super gentle fabric! My little girl looks absolutely adorable in her new outfit.",
    name: "Shalini",
    detail: "Mum to a baby boy",
  },
  {
    title: "Perfect for my little one ❤️",
    quote: "The dress is lightweight, soft, and so comfortable. My baby looks extra cute wearing it!",
    name: "Divya",
    detail: "Mum to a baby boy",
  },
];

const TINTS = ["#DFE7DD", "#F3D8C8", "#DCE6EE", "#F1E7BC"];

function Card({ r, i }: { r: Review; i: number }) {
  return (
    <figure className="mx-2.5 flex w-[18rem] shrink-0 flex-col rounded-[1.75rem] border border-line bg-paper p-6 sm:mx-3 sm:w-[22rem] sm:p-7">
      <div className="flex items-center gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-2xl leading-none"
          style={{ background: TINTS[i % TINTS.length] }}
          aria-hidden
        >
          “
        </span>
        <span className="text-sm tracking-widest text-[#E0A33A]" aria-label="5 stars">★★★★★</span>
      </div>
      <p className="mt-4 font-display text-xl leading-snug tracking-tight">{r.title}</p>
      <blockquote className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-ink-soft">{r.quote}</blockquote>
      <figcaption className="mt-5 border-t border-line pt-4">
        <p className="font-bold">{r.name}</p>
        <p className="text-sm text-ink-soft">{r.detail}</p>
      </figcaption>
    </figure>
  );
}

export function Testimonials({ inline = false }: { inline?: boolean }) {
  if (REVIEWS.length === 0) return null;
  // Two copies side by side make the loop seamless.
  const loop = [...REVIEWS, ...REVIEWS];

  return (
    <section className={inline ? "mt-16 sm:mt-28" : "py-16 sm:py-24"}>
      <Reveal className="text-center">
        <p className="eyebrow">From our parents</p>
        <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          Little words of <em className="text-sage-deep">love</em>
        </h2>
      </Reveal>

      <div
        className="group relative mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
        aria-label="Reviews from parents"
      >
        <div className="anim-marquee flex w-max py-2 group-hover:[animation-play-state:paused]" style={{ animationDuration: "45s" }}>
          {loop.map((r, i) => (
            <Card key={i} r={r} i={i % REVIEWS.length} />
          ))}
        </div>
      </div>
    </section>
  );
}
