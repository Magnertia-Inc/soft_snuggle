"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { ProductCard } from "../shop/ProductCard";
import { useAccount } from "../providers/AccountProvider";

export function WishlistView() {
  const { customer, wishlist, ready } = useAccount();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!customer) return;
    let live = true;
    fetch("/api/wishlist/items")
      .then((r) => r.json())
      .then((d) => live && setProducts(d.products ?? []))
      .catch(() => live && setProducts([]));
    return () => {
      live = false;
    };
  }, [customer, wishlist.length]);

  if (!ready) return <p className="py-24 text-center text-ink-soft">One moment…</p>;

  if (!customer) {
    return (
      <div className="py-24 text-center">
        <h1 className="font-display text-4xl tracking-tight">Your saved pieces</h1>
        <p className="mt-3 text-ink-soft">Log in to keep the ones you love in one place.</p>
        <Link href="/login?next=/wishlist" className="btn-primary mt-7 inline-block px-8 py-3.5">Log in</Link>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">Kept for later</p>
      <h1 className="mt-2 font-display text-5xl tracking-tight">Saved pieces</h1>

      {products === null ? (
        <p className="mt-10 text-ink-soft">One moment…</p>
      ) : products.length === 0 ? (
        <div className="mt-8 rounded-[1.75rem] border border-line bg-paper/70 p-12 text-center">
          <p className="font-display text-2xl">Nothing saved yet</p>
          <p className="mt-2 text-ink-soft">Tap the heart on anything you want to come back to.</p>
          <Link href="/shop" className="btn-primary mt-6 inline-block px-7 py-3">Have a look around</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3">
          {products.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
