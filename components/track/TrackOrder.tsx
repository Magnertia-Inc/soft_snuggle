"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { STORE, inr, phoneDigits } from "@/lib/store";
import { TRACK_STEPS, type TrackInfo } from "@/lib/tracking";
import { WhatsAppIcon } from "@/components/art/WhatsAppIcon";
import { useAccount } from "../providers/AccountProvider";

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : null;

export function TrackOrder({ initialCode }: { initialCode?: string }) {
  const { customer, ready: accountReady } = useAccount();
  const [code, setCode] = useState(initialCode ?? "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackInfo | null>(null);
  const [copied, setCopied] = useState(false);

  // Remember the phone number from checkout so returning customers only need the order ID.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ss-customer-v1") ?? "{}");
      if (saved.phone) setPhone(saved.phone);
    } catch {}
  }, []);

  // Signed in, the number is already known.
  useEffect(() => {
    if (customer?.phone) setPhone((p) => p || customer.phone);
  }, [customer]);

  const look = useCallback(async (orderCode: string, orderPhone: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: orderCode, phone: orderPhone }),
      });
      // A crashed server sends no body; reading it as JSON would throw a parse
      // error that tells the person nothing about their parcel.
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || "We couldn't look that up just now. Please try again.");
      setOrder(data);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    look(code, phone);
  };

  // Arriving from your own order list, there is nothing to fill in: show it.
  const [autoDone, setAutoDone] = useState(false);
  useEffect(() => {
    if (autoDone || !initialCode || !accountReady) return;
    if (!customer && !phone) return;
    setAutoDone(true);
    look(initialCode, customer?.phone ?? phone);
  }, [autoDone, initialCode, accountReady, customer, phone, look]);

  const stepIndex = order ? TRACK_STEPS.findIndex((s) => s.key === order.status) : -1;
  const stepDate: Record<string, string | null> = order
    ? { new: order.placedAt, confirmed: order.confirmedAt, shipped: order.shippedAt, delivered: order.deliveredAt }
    : {};

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-32 sm:px-6">
      <div className="text-center">
        <p className="eyebrow">Where&apos;s my parcel?</p>
        <h1 className="mt-3 font-display text-5xl tracking-tight sm:text-6xl">
          Track your <em className="text-sage-deep">order</em>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">
          Enter the order ID from your confirmation (like SS-1042) and the mobile number you ordered with.
        </p>
      </div>

      <form onSubmit={submit} className="mt-10 grid gap-3 rounded-[1.75rem] bg-paper p-5 shadow-[0_30px_60px_-40px_rgba(38,59,54,0.4)] sm:grid-cols-[1fr_1fr_auto] sm:p-6">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink-soft">Order ID</span>
          <input className="field uppercase" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="SS-1042" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink-soft">Mobile number</span>
          <input
            className="field"
            required={!customer}
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(phoneDigits(e.target.value))}
            placeholder="10-digit number"
          />
        </label>
        <button disabled={loading} className="btn-primary self-end py-[0.95rem]">
          {loading ? "Finding…" : "Track"}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 rounded-2xl bg-peach px-5 py-4 text-sm font-semibold"
            role="alert"
          >
            {error}
          </motion.p>
        )}

        {order && (
          <motion.div key={order.code} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 space-y-4">
            <div className="rounded-[1.75rem] bg-paper p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-3xl">Order {order.code}</h2>
                <span className="text-sm text-ink-soft">Last update {fmt(order.updatedAt)}</span>
              </div>

              {order.status === "cancelled" ? (
                <p className="mt-6 rounded-2xl bg-peach px-5 py-4 font-semibold">
                  This order was cancelled. If that&apos;s a surprise, message us on WhatsApp and we&apos;ll sort it out.
                </p>
              ) : (
                <ol className="mt-8 space-y-0">
                  {TRACK_STEPS.map((s, i) => {
                    const done = i <= stepIndex;
                    const current = i === stepIndex;
                    return (
                      <li key={s.key} className="relative flex gap-4 pb-7 last:pb-0">
                        {i < TRACK_STEPS.length - 1 && (
                          <span className="absolute left-[0.9375rem] top-8 h-[calc(100%-2rem)] w-0.5 overflow-hidden rounded bg-line">
                            <motion.span
                              className="block w-full bg-sage-deep"
                              initial={{ height: 0 }}
                              animate={{ height: i < stepIndex ? "100%" : 0 }}
                              transition={{ delay: 0.15 + i * 0.15, duration: 0.4 }}
                            />
                          </span>
                        )}
                        <motion.span
                          className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${
                            done ? "bg-sage-deep text-paper" : "bg-line text-ink-soft"
                          } ${current ? "ring-4 ring-sage" : ""}`}
                          initial={{ scale: 0.6 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1 + i * 0.15, type: "spring" }}
                        >
                          {done ? "✓" : i + 1}
                        </motion.span>
                        <div className="pt-1">
                          <p className={`font-bold ${done ? "text-ink" : "text-ink-soft"}`}>{s.label}</p>
                          <p className="text-sm text-ink-soft">
                            {current ? s.note : done && stepDate[s.key] ? fmt(stepDate[s.key]) : done ? "Done" : ""}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            {(order.courier || order.trackingNumber) && (
              <div className="rounded-[1.75rem] bg-sage p-6 sm:p-8">
                <p className="eyebrow text-ink">Courier details</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-2xl">{order.courier ?? "Courier"}</p>
                    {order.trackingNumber && (
                      <p className="mt-1 text-sm">
                        Tracking number <b className="font-mono tracking-wider">{order.trackingNumber}</b>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(order.trackingNumber!);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 1500);
                            } catch {}
                          }}
                          className="ml-2 rounded-full bg-paper px-2.5 py-0.5 text-xs font-bold"
                        >
                          {copied ? "Copied ✓" : "Copy"}
                        </button>
                      </p>
                    )}
                  </div>
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="btn-primary">
                      Track on courier site →
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-line bg-paper/70 p-6 text-sm">
                <p className="eyebrow">Items</p>
                <ul className="mt-3 space-y-1.5">
                  {order.items.map((i) => (
                    <li key={`${i.name}-${i.size}-${i.colour ?? ""}`}>
                      {i.name} · {i.colour ? `${i.colour} · ` : ""}{i.size} × {i.qty}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 font-display text-xl">
                  {inr(order.total)}{" "}
                  <span className="font-sans text-xs font-bold text-ink-soft">
                    {order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid via UPI"}
                  </span>
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-line bg-paper/70 p-6 text-sm">
                <p className="eyebrow">Delivering to</p>
                <p className="mt-3 font-semibold">
                  {order.city} – {order.pincode}
                </p>
                <p className="mt-1 text-ink-soft">Placed {fmt(order.placedAt)}</p>
                <a
                  href={`https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(`Hi Soft Snuggle! I have a question about my order ${order.code}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Ask about this order
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
