import type { Metadata } from "next";
import { FlowerMark } from "@/components/art/FlowerMark";
import { Reveal } from "@/components/Reveal";
import { WhatsAppIcon } from "@/components/art/WhatsAppIcon";
import { STORE, whatsappDisplay } from "@/lib/store";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  const cards = [
    {
      title: "WhatsApp",
      body: "Order any hour, ask about sizes and delivery, bulk orders or collaborations.",
      cta: `Chat on ${whatsappDisplay}`,
      href: `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(`Hi ${STORE.name}! `)}`,
      tint: "#DFE7DD",
      icon: <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />,
    },
    {
      title: "Email",
      body: "Write to us any time about orders, returns or anything else.",
      cta: STORE.email,
      href: `mailto:${STORE.email}`,
      tint: "#F3D8C8",
      icon: <span className="text-lg">✉️</span>,
    },
    {
      title: "Instagram",
      body: "New arrivals, little moments and offers first.",
      cta: "@veviba.baby",
      href: STORE.instagram,
      tint: "#DCE6EE",
      icon: <span className="text-lg">📸</span>,
    },
  ];

  return (
    // Sized to one phone screen with no footer below it, so the ways to
    // reach the shop are all in view without scrolling. svh rather than vh so
    // the mobile browser's own chrome is taken into account.
    <div className="speckle flex min-h-[100svh] flex-col justify-center px-4 pb-8 pt-24 sm:min-h-0 sm:px-6 sm:pb-24 sm:pt-32">
      <section className="mx-auto w-full max-w-5xl">
        <Reveal className="text-center">
          <FlowerMark className="anim-float mx-auto h-9 w-9 sm:h-12 sm:w-12" />
          <h1 className="mt-3 font-display text-4xl tracking-tight sm:mt-5 sm:text-6xl">
            Say <em className="text-sage-deep">hello</em>
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft sm:mt-3 sm:text-base">
            You can order from us 24×7.
          </p>
        </Reveal>

        {/* A row per channel on a phone, so they all fit in a screen; the old
            stacked cards ran to nearly twice the height of one. */}
        <div className="mx-auto mt-6 grid max-w-5xl gap-3 sm:mt-12 sm:gap-4 md:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <a
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="group flex h-full items-center gap-4 rounded-[1.375rem] p-4 transition-transform duration-500 hover:-translate-y-1.5 sm:block sm:rounded-[1.75rem] sm:p-7"
                style={{ background: c.tint }}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-paper sm:h-12 sm:w-12">
                  {c.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl sm:mt-6 sm:text-2xl">{c.title}</span>
                  <span className="mt-0.5 block text-[0.8125rem] leading-snug text-ink-soft sm:mt-1 sm:text-sm">{c.body}</span>
                  <span className="mt-1.5 block truncate text-[0.8125rem] font-bold underline-offset-4 group-hover:underline sm:mt-5 sm:inline-block sm:text-sm">
                    {c.cta} →
                  </span>
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
