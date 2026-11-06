import { Reveal } from "./Reveal";

// Parent testimonials for the About page.
//
// Put only REAL reviews in REVIEWS, in the parent's own words and with their
// permission. Invented reviews mislead buyers and are against India's
// consumer protection rules.
//
// While REVIEWS is empty, the section shows the sample cards below so the
// layout can be designed, but ONLY on your own computer (npm run dev). On the
// live site nothing is shown until real reviews are added.

type Review = { quote: string; name: string; detail: string };

const REVIEWS: Review[] = [
  {
    quote: "So soft for my little princess! I ordered a cute little dress for my baby girl, and I'm in love! The fabric is super soft, the colours are beautiful, and my little one looks like an angel. Thank you, Veviba! 💕",
    name: "Anitha",
    detail: "Mum to a baby girl",
  },
  {
    quote: "My baby's new favourite outfit! Such a lovely dress! The material feels so gentle on my baby's skin. She looks absolutely adorable, and I couldn't stop taking pictures. Definitely ordering more! 🥰",
    name: "Suguna",
    detail: "Mum to a baby girl",
  },
  {
    quote: "Totally worth it! Bought this for my little princess, and it's even prettier than I expected! The stitching is neat, the fabric is soft, and the fit is just perfect. So happy with my purchase! 🌸",
    name: "Shalini",
    detail: "Mum to a baby girl",
  },
];

// Preview text for designing the layout; never shown on the live site.
const SAMPLES: Review[] = [
  {
    quote: "So soft for my little princess! I ordered a cute little dress for my baby girl, and I'm in love! The fabric is super soft, the colours are beautiful, and my little one looks like an angel. Thank you, Veviba! 💕",
    name: "Parent name",
    detail: "Mum to a baby girl",
  },
  {
    quote: "My baby's new favourite outfit! Such a lovely dress! The material feels so gentle on my baby's skin. She looks absolutely adorable, and I couldn't stop taking pictures. Definitely ordering more! 🥰",
    name: "Parent name",
    detail: "Mum to a baby girl",
  },
  {
    quote: "Totally worth it! Bought this for my little princess, and it's even prettier than I expected! The stitching is neat, the fabric is soft, and the fit is just perfect. So happy with my purchase! 🌸",
    name: "Parent name",
    detail: "Mum to a baby girl",
  },
];

const TINTS = ["#DFE7DD", "#F3D8C8", "#DCE6EE"];

export function Testimonials({ inline = false }: { inline?: boolean }) {
  const isSample = REVIEWS.length === 0;
  if (isSample && process.env.NODE_ENV === "production") return null;
  const cards = isSample ? SAMPLES : REVIEWS;

  return (
    <section className={inline ? "mt-16 sm:mt-28" : "shell pb-20 sm:pb-28"}>
      <Reveal className="text-center">
        <p className="eyebrow">From our parents</p>
        <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          Little words of <em className="text-sage-deep">love</em>
        </h2>
        {isSample && (
          <p className="mx-auto mt-4 w-fit rounded-full bg-peach/60 px-4 py-1.5 text-xs font-bold">
            Layout preview: sample text, only visible on your computer
          </p>
        )}
      </Reveal>

      <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
        {cards.map((r, i) => (
          <Reveal key={i} delay={i * 0.12}>
            <figure className="flex h-full flex-col rounded-[1.75rem] border border-line bg-paper p-6 sm:p-8">
              <span
                className="grid h-11 w-11 place-items-center rounded-2xl font-display text-2xl leading-none sm:h-14 sm:w-14 sm:text-3xl"
                style={{ background: TINTS[i % TINTS.length] }}
                aria-hidden
              >
                “
              </span>
              <blockquote className="mt-5 flex-1 font-display text-xl leading-snug tracking-tight sm:text-2xl">
                {r.quote}
              </blockquote>
              <figcaption className="mt-6">
                <p className="font-bold">{r.name}</p>
                <p className="text-sm text-ink-soft">{r.detail}</p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
