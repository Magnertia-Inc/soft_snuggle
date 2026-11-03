"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STORE, whatsappDisplay } from "@/lib/store";
import { Logo } from "./art/Logo";
import { WhatsAppIcon } from "@/components/art/WhatsAppIcon";

const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/track", label: "Track order" },
  { href: "/policies/shipping", label: "Shipping" },
  { href: "/policies/returns", label: "Returns" },
  { href: "/policies/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
];

// Grouped headings for the phone footer: a flat list of six links gave no
// clue which were for buying and which were the small print. Wide screens
// keep the original centred row.
const COLUMNS = [
  {
    heading: "Shop",
    links: [
      { href: "/shop", label: "All pieces" },
      { href: "/track", label: "Track order" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    heading: "Help",
    links: [
      { href: "/policies/shipping", label: "Shipping" },
      { href: "/policies/returns", label: "Returns & exchanges" },
      { href: "/policies/privacy", label: "Privacy" },
    ],
  },
];

export function Footer() {
  // The contact page is a single phone screen by design; a footer under it
  // would both make it scroll and repeat the same links twice on one screen.
  if (usePathname() === "/contact") return null;

  const social = "grid h-9 w-9 place-items-center rounded-full bg-sage text-ink transition-colors hover:bg-sage-deep hover:text-paper";

  return (
    <footer className="relative overflow-hidden border-t border-line bg-paper text-ink-soft">
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 pt-8 text-center sm:gap-5 sm:pt-10">
        <Logo className="h-10 sm:h-12" />
        <p className="inline-flex items-center gap-2 rounded-full bg-sage px-4 py-1.5 text-[0.6875rem] font-extrabold uppercase tracking-[0.16em] text-ink">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#25D366]" /> 24×7 ordering available
        </p>
        {/* Phones get the two headed columns; wide screens keep the flat
            centred row this footer has always had. */}
        <div className="grid w-full grid-cols-2 gap-6 px-2 text-left sm:hidden">
          {COLUMNS.map((col) => (
            <nav key={col.heading}>
              <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.18em] text-ink">{col.heading}</p>
              <ul className="mt-2.5 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <nav className="hidden sm:flex sm:flex-wrap sm:justify-center sm:gap-x-7 sm:gap-y-2">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] transition-colors hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex gap-2">
          <a href={`https://wa.me/${STORE.whatsappNumber}`} target="_blank" rel="noreferrer" className={social} aria-label="WhatsApp">
            <WhatsAppIcon className="h-4 w-4" />
          </a>
          <a href={STORE.instagram} target="_blank" rel="noreferrer" className={social} aria-label="Instagram">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>
        <a href={`https://wa.me/${STORE.whatsappNumber}`} target="_blank" rel="noreferrer" className="text-sm hover:text-ink">
          WhatsApp {whatsappDisplay}
        </a>
      </div>

      {/* Big soft logo watermark */}
      <div aria-hidden="true" className="pointer-events-none mt-6 hidden justify-center px-4 opacity-[0.16] sm:flex">
        <img src="/logo.webp" alt="" className="w-full max-w-4xl" draggable={false} />
      </div>

      <div className="relative z-10 border-t border-line/70 px-4 py-4 text-center text-xs">
        © {new Date().getFullYear()} Soft Snuggle · Little clothes, lots of love
      </div>
    </footer>
  );
}
