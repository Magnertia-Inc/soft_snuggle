"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { isStudioShot } from "@/lib/photo";
import { inr, isSoldOut } from "@/lib/store";
import type { Product } from "@/lib/types";
import { Garment } from "../art/Garment";
import { BagIcon } from "../Navbar";
import { useCart } from "../providers/CartProvider";
import { SaveButton } from "./SaveButton";

export function ProductCard({ product, wide = false }: { product: Product; wide?: boolean }) {
  const { add } = useCart();
  const [picking, setPicking] = useState(false);
  const [front] = product.images;
  const available = !isSoldOut(product);

  const addSize = (size: string) => {
    add({
      productId: product.id, slug: product.slug, name: product.name, category: product.category,
      price: product.price, size, colour: product.colours[0]?.name, qty: 1, tint: product.tint, garment: product.garment, image: front,
    });
    setPicking(false);
  };

  return (
    <div className="group">
      <div className="relative overflow-hidden rounded-[1.5rem]" style={{ background: product.tint }}>
        <Link href={`/product/${product.slug}`} className={`relative block ${wide ? "aspect-[3/2]" : "aspect-[4/5]"}`} aria-label={product.name}>
          {front ? (
            <>
              {/* The card holds still under the cursor: no swap to the back
                  view, no zoom. The back photo is on the product page. */}
              <img
                src={front}
                alt={product.name}
                loading="lazy"
                className={`absolute inset-0 h-full w-full object-cover ${
                  isStudioShot(front) ? "mix-blend-multiply" : ""
                }`}
              />
            </>
          ) : (
            <>
              <div className="absolute inset-[12%] rounded-full bg-paper/40 blur-2xl" />
              <div className="relative grid h-full place-items-center transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-2 group-hover:rotate-[-4deg] group-hover:scale-105">
                <Garment category={product.category} color={product.garment} className="h-[76%] w-[76%]" />
              </div>
            </>
          )}
        </Link>

        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.14em]">
            {product.badge}
          </span>
        )}

        <SaveButton
          productId={product.id}
          className="absolute right-3 top-3 h-9 w-9 bg-paper/90 text-ink shadow-sm backdrop-blur hover:bg-paper"
        />

        <div
          className={`absolute inset-x-3 bottom-3 transition-all duration-300 ${
            picking ? "" : "[@media(hover:hover)]:translate-y-3 [@media(hover:hover)]:opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {picking ? (
              <motion.div
                key="sizes"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                className="glass-light rounded-2xl p-2.5 sm:p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[0.6875rem] font-extrabold uppercase tracking-widest text-ink-soft">Pick a size</span>
                  <button onClick={() => setPicking(false)} className="text-xs font-bold" aria-label="Close sizes">
                    ✕
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => addSize(s)}
                      disabled={product.soldOutSizes.includes(s)}
                      title={product.soldOutSizes.includes(s) ? "Sold out" : undefined}
                      className="rounded-full border border-ink/15 bg-paper px-2.5 py-1.5 text-xs font-bold transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:bg-transparent disabled:text-ink-soft/60 disabled:line-through sm:px-3"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="add"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                onClick={() => setPicking(true)}
                disabled={!available}
                aria-label={available ? `Add ${product.name} to bag` : "Sold out"}
                className={`ml-auto flex items-center justify-center rounded-full bg-ink text-[0.8125rem] font-bold text-paper shadow-md disabled:bg-ink/40 sm:w-full sm:rounded-2xl sm:py-2.5 sm:shadow-none ${
                  available ? "h-10 w-10 sm:h-auto" : "h-8 px-3 text-[0.6875rem] sm:h-auto sm:text-[0.8125rem]"
                }`}
              >
                {available ? (
                  <>
                    {/* Phones: a small round button, so the photo stays visible */}
                    <span className="relative sm:hidden" aria-hidden>
                      <BagIcon className="h-[1.125rem] w-[1.125rem]" />
                      <span className="absolute -right-1.5 -top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-butter text-[0.625rem] font-extrabold leading-none text-ink">+</span>
                    </span>
                    <span className="hidden sm:inline">Add to bag +</span>
                  </>
                ) : (
                  "Sold out"
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Link href={`/product/${product.slug}`} className="mt-3 block px-1">
        <h3 className="font-display text-base leading-tight tracking-tight sm:text-lg">{product.name}</h3>
        <p className="mt-1.5 font-bold">
          {inr(product.price)}
          {product.compareAt && <s className="ml-1.5 text-sm font-normal text-ink-soft">{inr(product.compareAt)}</s>}
        </p>
      </Link>
    </div>
  );
}
