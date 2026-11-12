"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STORE, whatsappDisplay } from "@/lib/store";
import { WhatsAppIcon } from "@/components/art/WhatsAppIcon";

const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/track", label: "Track order" },
  { href: "/policies/shipping", label: "Shipping" },
  { href: "/policies/returns", label: "Returns" },
  { href: "/policies/privacy", label: "Privacy" },
  { href: "/policies/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

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
      { href: "/policies/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  if (usePathname() === "/contact") return null;

  const social = "grid h-9 w-9 place-items-center rounded-full bg-sage text-ink transition-colors hover:bg-sage-deep hover:text-paper";

  return (
    <footer className="relative overflow-hidden border-t border-line bg-paper text-ink-soft">
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 pt-7 text-center sm:gap-5 sm:pt-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-sage px-4 py-1.5 text-[0.6875rem] font-extrabold uppercase tracking-[0.16em] text-ink">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#25D366]" /> 24×7 ordering available
        </p>

        {/* Phones get the two headed columns; wide screens keep the flat centred row */}
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
          <a
            href={STORE.whatsappChannel}
            target="_blank"
            rel="noreferrer"
            aria-label="Join our WhatsApp channel for coupons"
            title="Join our WhatsApp channel — coupons on every purchase"
            className="relative grid h-9 w-9 place-items-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-110"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-paper shadow ring-1 ring-[#25D366]">
              <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-[#1da851]" fill="currentColor" aria-hidden="true">
                <path d="M3 10v4a1 1 0 0 0 1 1h2l6 4.5V4.5L6 9H4a1 1 0 0 0-1 1zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
              </svg>
            </span>
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
        <a href={`mailto:${STORE.email}`} className="text-sm hover:text-ink">
          {STORE.email}
        </a>
      </div>

      {/* Soft logo watermark */}
      <div aria-hidden="true" className="pointer-events-none mt-4 flex justify-center px-4 opacity-[0.2]">
        <img src="/logo.webp" alt="" className="w-full max-w-2xl sm:max-w-3xl" draggable={false} />
      </div>

      <div className="relative z-10 border-t border-line/70 px-4 py-3 text-center text-xs">
        © {new Date().getFullYear()} Veviba · Little clothes, lots of love
      </div>
    </footer>
  );
}
