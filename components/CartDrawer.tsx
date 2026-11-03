"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { STORE, inr, shippingFor, shippingIsFree } from "@/lib/store";
import { ProductThumb } from "./shop/ProductThumb";
import { FlowerMark } from "./art/FlowerMark";
import { useCart } from "./providers/CartProvider";

export function CartDrawer() {
  const { items, isOpen, close, setQty, remove, subtotal } = useCart();
  const shipping = shippingFor(subtotal);
  const toFree = Math.max(0, STORE.freeShippingAbove - subtotal);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-ink/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col bg-paper shadow-2xl sm:inset-y-3 sm:right-3 sm:rounded-[1.75rem]"
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            role="dialog"
            aria-label="Your bag"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="font-display text-2xl">
                Your <em className="text-sage-deep">bag</em>
              </h2>
              <button onClick={close} className="grid h-9 w-9 place-items-center rounded-full bg-cream text-lg" aria-label="Close bag">
                ✕
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                  <FlowerMark className="h-16 w-16" />
                </motion.div>
                <p className="font-display text-2xl">Your bag is feeling a little empty</p>
                <p className="text-ink-soft">Let&apos;s find something soft for your little one.</p>
                <Link href="/shop" onClick={close} className="btn-primary mt-2">
                  Start shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="px-6 pt-4">
                  {/* With delivery free on everything there is no threshold to
                      climb towards, so the progress bar would always be full
                      and the nudge meaningless. Just say it ships free. */}
                  {shippingIsFree ? (
                    <p className="text-sm font-semibold text-ink-soft">
                      Your order ships <b className="text-ink">free</b> 🎉
                    </p>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-ink-soft">
                        {toFree > 0 ? (
                          <>You&apos;re <b className="text-ink">{inr(toFree)}</b> away from free shipping</>
                        ) : (
                          <>Yay! Your order ships <b className="text-ink">free</b> 🎉</>
                        )}
                      </p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream">
                        <motion.div
                          className="h-full rounded-full bg-sage-deep"
                          animate={{ width: `${Math.min(100, (subtotal / STORE.freeShippingAbove) * 100)}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>

                <ul className="flex-1 space-y-3 overflow-y-auto px-6 py-4" data-lenis-prevent>
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={`${item.productId}-${item.size}-${item.colour ?? ""}`}
                        layout
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30, height: 0, marginTop: 0 }}
                        className="flex gap-4 rounded-2xl bg-cream p-3"
                      >
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={close}
                          className="grid h-24 w-20 shrink-0 place-items-center overflow-hidden rounded-xl"
                          style={{ background: item.tint }}
                        >
                          <ProductThumb image={item.image} category={item.category} garment={item.garment} className="h-20 w-20" />
                        </Link>
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-display text-lg leading-tight">{item.name}</p>
                            <button
                              onClick={() => remove(item.productId, item.size, item.colour)}
                              className="text-xs font-bold text-ink-soft underline-offset-2 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                          <p className="text-sm text-ink-soft">{item.colour ? `${item.colour} · ` : ""}Size {item.size}</p>
                          <div className="mt-auto flex items-center justify-between">
                            <QtyStepper value={item.qty} onChange={(q) => setQty(item.productId, item.size, item.colour, q)} />
                            <span className="font-bold">{inr(item.price * item.qty)}</span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <div className="space-y-2 border-t border-line px-6 py-5">
                  <Row label="Subtotal" value={inr(subtotal)} />
                  <Row label="Shipping" value={shipping === 0 ? "Free" : inr(shipping)} />
                  <div className="flex justify-between pt-1 font-display text-xl">
                    <span>Total</span>
                    <span>{inr(subtotal + shipping)}</span>
                  </div>
                  <Link href="/checkout" onClick={close} className="btn-primary mt-3 w-full">
                    Checkout →
                  </Link>
                  <p className="text-center text-xs text-ink-soft">24×7 ordering · UPI or Cash on Delivery · Confirmed on WhatsApp</p>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm text-ink-soft">
      <span>{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

export function QtyStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center rounded-full border border-line bg-paper">
      <button className="h-8 w-8 rounded-full text-lg" onClick={() => onChange(value - 1)} aria-label="Decrease quantity">
        −
      </button>
      <span className="w-6 text-center text-sm font-bold tabular-nums">{value}</span>
      <button
        className="h-8 w-8 rounded-full text-lg disabled:opacity-30"
        onClick={() => onChange(value + 1)}
        disabled={value >= 10}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
