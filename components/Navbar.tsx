"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { useEffect, useRef, useState } from "react";
import { STORE, inr, shippingLine } from "@/lib/store";
import { Logo } from "./art/Logo";
import { WhatsAppIcon } from "@/components/art/WhatsAppIcon";
import { useAccount } from "./providers/AccountProvider";
import { useCart } from "./providers/CartProvider";

const LEFT = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
];
const RIGHT = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const { count, open } = useCart();
  const { customer, wishlist } = useAccount();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(90);
  const lenis = useLenis();

  useEffect(() => setMenuOpen(false), [pathname]);

  // The menu sits just under the header, whatever height the header ends up
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeaderHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keep the page still while the menu is open
  useEffect(() => {
    if (!menuOpen) return;
    lenis?.stop();
    const close = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", close);
    return () => {
      lenis?.start();
      window.removeEventListener("keydown", close);
    };
  }, [menuOpen, lenis]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const navLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      key={href}
      href={href}
      className={`relative py-1 text-[0.75rem] font-bold uppercase tracking-[0.18em] transition-colors ${
        isActive(href) ? "text-ink" : "text-ink-soft hover:text-ink"
      }`}
    >
      {label}
      {isActive(href) && (
        <motion.span
          layoutId="nav-underline"
          className="absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full bg-sage-deep"
          transition={{ type: "spring", stiffness: 400, damping: 34 }}
        />
      )}
    </Link>
  );

  return (
    <>
      <header ref={headerRef} className="fixed inset-x-0 top-0 z-50">
        {/* Offer strip */}
        {/* One line on every screen: phones get the short version so it never wraps */}
        <div className="relative truncate bg-sage-deep px-4 py-1.5 text-center text-[0.6563rem] font-bold uppercase tracking-[0.12em] text-paper sm:text-[0.6875rem] sm:tracking-[0.14em]">
          <span className="hidden sm:inline">24×7 ordering available · </span>
          {shippingLine}
          <span className="sm:hidden"> · COD available</span>
          <span className="hidden lg:inline"> · Cash on Delivery</span>
          <Link
            href="/track"
            className="absolute right-6 top-1/2 hidden -translate-y-1/2 underline decoration-paper/50 underline-offset-2 hover:decoration-paper md:block"
          >
            Track order
          </Link>
        </div>

        {/* Main bar: links split around a centred logo */}
        <nav className="border-b border-line/80 bg-cream/85 backdrop-blur-md">
          <div className="shell grid h-14 grid-cols-[1fr_auto_1fr] items-center">
            <LayoutGroup id="nav">
              <div className="flex items-center gap-7">
                <button
                  className="-ml-2 grid h-11 w-11 place-items-center rounded-full md:hidden"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Menu"
                  aria-expanded={menuOpen}
                >
                  <div className="relative h-2.5 w-4">
                    <span className={`absolute left-0 h-0.5 w-4 rounded bg-ink transition-all ${menuOpen ? "top-1 rotate-45" : "top-0"}`} />
                    <span className={`absolute left-0 h-0.5 w-4 rounded bg-ink transition-all ${menuOpen ? "top-1 -rotate-45" : "top-2"}`} />
                  </div>
                </button>
                <div className="hidden items-center gap-7 md:flex">
                  {LEFT.map(navLink)}
                </div>
              </div>

              <Link href="/" className="flex items-center" aria-label="Veviba home">
                <Logo className="h-14 sm:h-16" />
              </Link>

              <div className="flex items-center justify-end gap-0.5 sm:gap-2 md:gap-5 lg:gap-7">
                <div className="hidden items-center gap-7 md:flex">
                  {RIGHT.map(navLink)}
                </div>
                <Link
                  href="/wishlist"
                  className="relative hidden h-9 w-9 place-items-center rounded-full text-ink transition-colors hover:bg-sage/70 sm:grid"
                  aria-label={`Saved pieces, ${wishlist.length} saved`}
                >
                  <HeartIcon className="h-[1.125rem] w-[1.125rem]" />
                  {wishlist.length > 0 && (
                    <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose px-1 text-[0.625rem] font-bold text-paper">
                      {wishlist.length}
                    </span>
                  )}
                </Link>

                <Link
                  href={customer ? "/account" : "/login"}
                  className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-sage/70"
                  aria-label={customer ? `Your account, ${customer.name}` : "Log in"}
                  title={customer ? customer.name : "Log in"}
                >
                  {customer ? (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-sage-deep text-[0.6875rem] font-extrabold uppercase text-paper">
                      {customer.name.trim().charAt(0)}
                    </span>
                  ) : (
                    <UserIcon className="h-[1.125rem] w-[1.125rem]" />
                  )}
                </Link>

                <button
                  onClick={open}
                  className="-mr-1.5 flex h-10 items-center gap-1.5 rounded-full pl-2.5 pr-1.5 text-ink transition-colors hover:bg-sage/70"
                  aria-label={`Open bag, ${count} items`}
                >
                  <BagIcon className="h-[1.125rem] w-[1.125rem]" />
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={count}
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.3, opacity: 0 }}
                      className="grid h-5 min-w-5 place-items-center rounded-full bg-butter px-1 text-[0.6875rem] font-bold"
                    >
                      {count}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </div>
            </LayoutGroup>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Dim the page behind the menu; tapping it closes the menu */}
            <motion.div
              className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              className="fixed inset-x-3 z-40 max-h-[calc(100svh-7rem)] overflow-y-auto rounded-[1.75rem] border border-line bg-paper p-3 shadow-2xl md:hidden"
              style={{ top: headerHeight + 8 }}
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              data-lenis-prevent
            >
              <nav className="flex flex-col">
                {[...LEFT, ...RIGHT].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3.5 font-display text-2xl tracking-tight ${
                      isActive(l.href) ? "bg-sage text-ink" : "text-ink"
                    }`}
                  >
                    {l.label}
                    <span aria-hidden className="text-base text-ink-soft">→</span>
                  </Link>
                ))}
              </nav>
              <div className="mt-2 grid grid-cols-3 gap-2 border-t border-line pt-3">
                {[
                  { href: "/track", label: "Track order", icon: <BagIcon className="h-5 w-5" /> },
                  { href: "/wishlist", label: wishlist.length ? `Saved (${wishlist.length})` : "Saved", icon: <HeartIcon className="h-5 w-5" /> },
                  { href: customer ? "/account" : "/login", label: customer ? "Account" : "Log in", icon: <UserIcon className="h-5 w-5" /> },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-cream px-2 py-3 text-center text-xs font-bold text-ink"
                  >
                    {l.icon}
                    {l.label}
                  </Link>
                ))}
              </div>
              <a
                href={`https://wa.me/${STORE.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3.5 text-sm font-bold text-white"
              >
                <WhatsAppIcon className="h-5 w-5" /> Chat with us on WhatsApp
              </a>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function BagIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M12 20.5s-7.5-4.7-7.5-9.7a4.3 4.3 0 0 1 7.5-2.9 4.3 4.3 0 0 1 7.5 2.9c0 5-7.5 9.7-7.5 9.7Z" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
    </svg>
  );
}
