"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { TRACK_STEPS } from "@/lib/tracking";
import { inr } from "@/lib/store";
import { useAccount } from "../providers/AccountProvider";
<<<<<<< HEAD
=======
import { ReferCard } from "./ReferCard";
>>>>>>> 80bc67a7677a41ee33f01877f7155ca1a3e91ddf

const stepLabel = (status: string) =>
  TRACK_STEPS.find((s) => s.key === status)?.label ?? (status === "cancelled" ? "Cancelled" : "Placed");

/** google: whether Google sign-in is set up. notice: the result of connecting Google, if they just did. */
export function AccountDashboard({ google = false, notice = null }: { google?: boolean; notice?: string | null }) {
  const router = useRouter();
  const { customer, orders, wishlist, ready, logout } = useAccount();

  if (!ready) return <p className="py-24 text-center text-ink-soft">One moment…</p>;

  if (!customer) {
    return (
      <div className="py-24 text-center">
        <h1 className="font-display text-4xl tracking-tight">You&apos;re not logged in</h1>
        <p className="mt-3 text-ink-soft">Log in to see your orders and the pieces you&apos;ve saved.</p>
        <Link href="/login" className="btn-primary mt-7 inline-block px-8 py-3.5">Log in</Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-ink">
        ← Back to home
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Your account</p>
          <h1 className="mt-2 break-words font-display text-4xl tracking-tight sm:text-5xl">Hello, {customer.name.split(" ")[0]}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-soft">
            <span>+91 {customer.phone}</span>
            {customer.phoneVerified ? (
              <span className="rounded-full bg-sage px-2.5 py-0.5 text-xs font-bold text-ink">✓ Verified</span>
            ) : (
              <span className="rounded-full bg-butter px-2.5 py-0.5 text-xs font-bold text-ink">Not verified yet</span>
            )}
            {customer.email && <span>· {customer.email}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/shop" className="btn-primary px-5 py-2.5 text-sm">
            Continue shopping →
          </Link>
          <button
            onClick={async () => {
              await logout();
              router.push("/");
            }}
            className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-bold hover:border-ink/40"
          >
            Log out
          </button>
        </div>
      </div>

      {notice && <p role="status" className="mt-6 rounded-2xl bg-sage/70 px-4 py-3 text-sm">{notice}</p>}

      {!customer.phoneVerified && (
        <p className="mt-6 rounded-2xl bg-butter/60 px-4 py-3 text-sm">
          Your number is verified when your first order reaches us on WhatsApp from +91 {customer.phone}. Orders you
          placed earlier without logging in appear here after that.
        </p>
      )}

      {google && !customer.google && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-paper/70 px-4 py-3">
          <p className="text-sm">
            <b>Log in faster with Google.</b> <span className="text-ink-soft">Connect it once, then one tap opens this account.</span>
          </p>
          <a href="/api/auth/google?next=/account" className="rounded-full border-[1.5px] border-ink px-4 py-2 text-sm font-bold hover:bg-ink hover:text-paper">
            Connect Google
          </a>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/wishlist" className="rounded-[1.75rem] bg-sage p-7 transition-transform hover:-translate-y-1">
          <p className="font-display text-3xl">{wishlist.length}</p>
          <p className="mt-1 font-bold">Saved {wishlist.length === 1 ? "piece" : "pieces"}</p>
          <p className="mt-1 text-sm text-ink-soft">The ones you came back to.</p>
        </Link>
        <div className="rounded-[1.75rem] bg-peach p-7">
          <p className="font-display text-3xl">{orders.length}</p>
          <p className="mt-1 font-bold">{orders.length === 1 ? "Order" : "Orders"}</p>
          <p className="mt-1 text-sm text-ink-soft">Everything you&apos;ve sent our way.</p>
        </div>
      </div>

      <ReferCard />

      <h2 className="mt-14 font-display text-3xl tracking-tight">Your orders</h2>

      {orders.length === 0 ? (
        <div className="mt-5 rounded-[1.75rem] border border-line bg-paper/70 p-10 text-center">
          <p className="text-ink-soft">Nothing here yet.</p>
          <Link href="/shop" className="btn-primary mt-5 inline-block px-7 py-3">Have a look around</Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {orders.map((o, i) => (
            <motion.li
              key={o.code}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-[1.75rem] border border-line bg-paper/70 p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl">{o.code}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {new Date(o.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <span className="rounded-full bg-sage px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em]">
                  {stepLabel(o.status)}
                </span>
              </div>
              <ul className="mt-4 space-y-1 text-sm text-ink-soft">
                {o.items.map((it) => (
                  <li key={`${it.name}-${it.size}-${it.colour ?? ""}`}>
                    {it.name} · {it.colour ? `${it.colour} · ` : ""}{it.size} × {it.qty}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                <span className="font-bold">{inr(o.total)}</span>
                <Link href={`/track?code=${o.code}`} className="text-sm font-bold underline underline-offset-4">
                  Track this order →
                </Link>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
