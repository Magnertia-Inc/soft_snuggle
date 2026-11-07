"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { SHIPPING_LABEL, STORE, TOTAL_LABEL, deliveryBy, inr } from "@/lib/store";
import type { Order } from "@/lib/types";
import { orderMessage, whatsappLink } from "@/lib/whatsapp";
import { FlowerMark } from "../art/FlowerMark";
import { WhatsAppIcon } from "@/components/art/WhatsAppIcon";

interface Props {
  order: Order;
  upiUrl: string;
  upiId: string;
  payee: string;
  qrSvg: string;
  /** Whether the customer has filled in the feedback form */
  feedbackGiven: boolean;
}

type Step = "pay" | "utr" | "whatsapp";

export function OrderFlow({ order, upiUrl, upiId, payee, qrSvg, feedbackGiven }: Props) {
  const isUpi = order.paymentMethod === "upi";
  const [step, setStep] = useState<Step>(!isUpi || order.utr ? "whatsapp" : "pay");
  const [utr, setUtr] = useState(order.utr ?? "");
  const [utrError, setUtrError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const firstName = order.customerName.split(" ")[0];
  const [trackUrl, setTrackUrl] = useState<string>();

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    setTrackUrl(`${window.location.origin}/track?code=${order.code}`);
  }, []);

  const saveUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{12}$/.test(utr)) {
      setUtrError(`The UTR is 12 digits; you've entered ${utr.length}. Please check it in your UPI app.`);
      return;
    }
    setSaving(true);
    setUtrError(null);
    try {
      const res = await fetch(`/api/orders/${order.code}/utr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: order.accessKey, utr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUtr(data.utr);
      setStep("whatsapp");
    } catch (err) {
      setUtrError(err instanceof Error ? err.message : "Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const steps = isUpi ? (["pay", "utr", "whatsapp"] as Step[]) : (["whatsapp"] as Step[]);
  const stepIndex = steps.indexOf(step);
  // Once the shop has confirmed or cancelled the order, the pay / UTR / WhatsApp
  // steps are done with: showing them again could get a cancelled order paid for.
  const cancelled = order.status === "cancelled";
  const settled = order.status !== "new";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
      {/* Header */}
      <div className="text-center">
        <motion.div
          className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-sage"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 12 }}
        >
          <FlowerMark className="h-11 w-11" />
        </motion.div>
        <motion.h1
          className="mt-6 font-display text-5xl tracking-tight sm:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {cancelled ? "Order cancelled" : <>Thank you, <em className="text-sage-deep">{firstName}!</em></>}
        </motion.h1>
        <p className="mt-3 text-lg text-ink-soft">
          Order <b className="text-ink">{order.code}</b>{" "}
          {cancelled
            ? "was cancelled."
            : settled
              ? "is confirmed."
              : <>is saved. {isUpi ? "Just pay and send it to us on WhatsApp to confirm." : "Send it to us on WhatsApp to confirm."}</>}
        </p>
      </div>

      {/* Progress */}
      {!settled && steps.length > 1 && (
        <div className="mx-auto mt-10 flex max-w-md items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold transition-colors ${
                  i <= stepIndex ? "bg-ink text-paper" : "bg-line text-ink-soft"
                }`}
              >
                {i < stepIndex ? "✓" : i + 1}
              </span>
              <span className="hidden text-xs font-bold uppercase tracking-wider text-ink-soft sm:block">
                {s === "pay" ? "Pay" : s === "utr" ? "UTR" : "WhatsApp"}
              </span>
              {i < steps.length - 1 && (
                <div className="h-0.5 flex-1 overflow-hidden rounded bg-line">
                  <motion.div className="h-full bg-ink" animate={{ width: i < stepIndex ? "100%" : "0%" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-[2rem] bg-paper p-6 shadow-[0_30px_60px_-40px_rgba(38,59,54,0.4)] sm:p-10">
        {cancelled ? (
          <div>
            <h2 className="font-display text-3xl">This order won&apos;t be sent</h2>
            <p className="mt-2 text-ink-soft">
              Please don&apos;t pay for it. If you already have, or think this is a mistake, message us on WhatsApp and we&apos;ll sort it out.
            </p>
            <a
              href={whatsappLink(`Hi ${STORE.name}! About my cancelled order ${order.code}:`)}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-[#25D366] py-4 text-base font-bold text-white"
            >
              <WhatsAppIcon className="h-6 w-6" />
              Message us on WhatsApp
            </a>
          </div>
        ) : settled ? (
          <div>
            <h2 className="font-display text-3xl">We&apos;ve confirmed your order ✓</h2>
            <p className="mt-2 text-ink-soft">Nothing more to do. We&apos;ll keep you posted on WhatsApp until it reaches you.</p>
            <Link href={`/track?code=${order.code}`} className="btn-primary mt-6 w-full py-4 text-base">
              Track this order
            </Link>
          </div>
        ) : (
        <AnimatePresence mode="wait">
          {step === "pay" && (
            <Panel key="pay">
              <p className="eyebrow">Step 1</p>
              <h2 className="mt-2 font-display text-3xl">
                Pay <span className="text-sage-deep">{inr(order.total)}</span> with UPI
              </h2>
              <p className="mt-2 text-ink-soft">The amount and order number are already filled in for you.</p>

              <div className="mt-6 grid items-center gap-6 sm:grid-cols-[13.75rem_1fr]">
                <AnimatePresence>
                  {(!isMobile || showQr) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mx-auto w-[13.75rem] rounded-3xl border border-line bg-paper p-3"
                    >
                      <div className="aspect-square [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                      <p className="mt-2 text-center text-xs font-bold text-ink-soft">Scan with any UPI app</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className={!isMobile || showQr ? "" : "sm:col-span-2"}>
                  {isMobile && (
                    <a href={upiUrl} className="btn-primary w-full py-4 text-base">
                      Pay {inr(order.total)} in your UPI app
                    </a>
                  )}
                  <div className="mt-3 rounded-2xl bg-cream p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-ink-soft">UPI ID · {payee}</p>
                        <p className="font-bold">{upiId}</p>
                      </div>
                      <button onClick={copyUpi} className="rounded-full bg-paper px-3 py-1.5 text-xs font-bold">
                        {copied ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                    <p className="mt-2 text-ink-soft">
                      Amount <b className="text-ink">{inr(order.total)}</b> · Note <b className="text-ink">{order.code}</b>
                    </p>
                  </div>
                  {isMobile && !showQr && (
                    <button onClick={() => setShowQr(true)} className="mt-3 text-sm font-bold underline underline-offset-4">
                      Show QR code instead
                    </button>
                  )}
                  <button onClick={() => setStep("utr")} className="btn-ghost mt-5 w-full">
                    I&apos;ve paid → next
                  </button>
                </div>
              </div>
            </Panel>
          )}

          {step === "utr" && (
            <Panel key="utr">
              <p className="eyebrow">Step 2</p>
              <h2 className="mt-2 font-display text-3xl">Enter your UPI reference</h2>
              <p className="mt-2 text-ink-soft">
                Open your payment in GPay / PhonePe / Paytm and copy the <b>12-digit UTR</b> (also called UPI Ref No. or Transaction ID). It
                helps us match your payment quickly.
              </p>
              <form onSubmit={saveUtr} className="mt-6">
                <input
                  className="field text-center font-mono text-xl tracking-[0.2em]"
                  value={utr}
                  onChange={(e) => {
                    setUtr(e.target.value.replace(/\D/g, "").slice(0, 12));
                    setUtrError(null);
                  }}
                  placeholder="e.g. 412345678901"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label="12-digit UTR"
                  aria-describedby="utr-count"
                  required
                  autoFocus
                />
                <p id="utr-count" className={`mt-1.5 text-center text-xs font-bold ${utr.length === 12 ? "text-sage-deep" : "text-ink-soft"}`}>
                  {utr.length}/12 digits
                </p>
                {utrError && <p className="mt-2 text-sm font-semibold text-[#B4513F]">{utrError}</p>}
                <div className="mt-5 flex gap-3">
                  <button type="button" onClick={() => setStep("pay")} className="btn-ghost">
                    ← Back
                  </button>
                  <button disabled={saving} className="btn-primary flex-1">
                    {saving ? "Saving…" : "Continue"}
                  </button>
                </div>
              </form>
            </Panel>
          )}

          {step === "whatsapp" && (
            <Panel key="wa">
              {isUpi && <p className="eyebrow">Step 3</p>}
              <h2 className="mt-2 font-display text-3xl">{sent ? "All done! 🎉" : "Send your order on WhatsApp"}</h2>
              <p className="mt-2 text-ink-soft">
                {sent
                  ? "Thanks! We'll check your order and reply on WhatsApp shortly. You can close this page."
                  : "We've written the message for you. WhatsApp will open, just tap Send."}
              </p>
              <pre className="mt-6 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#E7F6E9] p-5 font-sans text-sm leading-relaxed text-ink" data-lenis-prevent>
                {orderMessage(order, utr, trackUrl)}
              </pre>
              <motion.a
                href={whatsappLink(orderMessage(order, utr, trackUrl))}
                target="_blank"
                rel="noreferrer"
                onClick={() => setSent(true)}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-[#25D366] py-4 text-base font-bold text-white shadow-[0_16px_30px_-14px_rgba(37,211,102,0.8)]"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                animate={sent ? {} : { scale: [1, 1.03, 1] }}
                transition={{ scale: { duration: 1.6, repeat: Infinity } }}
              >
                <WhatsAppIcon className="h-6 w-6" />
                {sent ? "Open WhatsApp again" : "Send order on WhatsApp"}
              </motion.a>
              {isUpi && !sent && (
                <button onClick={() => setStep("utr")} className="mt-3 w-full text-sm font-bold text-ink-soft underline underline-offset-4">
                  Edit UTR
                </button>
              )}
            </Panel>
          )}
        </AnimatePresence>
        )}
      </div>

      {order.status === "delivered" && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-line bg-sage/50 p-6">
          <div>
            <p className="font-display text-2xl">{feedbackGiven ? "Thanks for your feedback!" : "Your order has arrived. How was it?"}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {feedbackGiven ? "Your thank-you codes and reviews are on your feedback page." : "Rate your order and review what you bought: each gets you 5% off your next order."}
            </p>
          </div>
          <Link href={`/feedback/${order.code}?k=${order.accessKey}`} className="btn-primary px-7">
            {feedbackGiven ? "See feedback" : "Give feedback"}
          </Link>
        </div>
      )}

      {/* Summary */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.75rem] border border-line bg-paper/70 p-6">
          <p className="eyebrow">Items</p>
          <ul className="mt-3 space-y-2 text-sm">
            {order.items.map((i) => (
              <li key={`${i.productId}-${i.size}-${i.colour ?? ""}`} className="flex justify-between gap-3">
                <span>{i.name} · {i.colour ? `${i.colour} · ` : ""}{i.size} × {i.qty}</span>
                <span className="font-bold">{inr(i.price * i.qty)}</span>
              </li>
            ))}
            {order.discount > 0 && (
              <li className="flex justify-between border-t border-line pt-2 text-ink-soft">
                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                <span>−{inr(order.discount)}</span>
              </li>
            )}
            <li className={`flex justify-between text-ink-soft ${order.discount > 0 ? "" : "border-t border-line pt-2"}`}>
              <span>{SHIPPING_LABEL}</span>
              <span>{order.shipping === 0 ? "Free" : inr(order.shipping)}</span>
            </li>
            {order.codFee > 0 && (
              <li className="flex justify-between text-ink-soft">
                <span>Cash on Delivery fee</span>
                <span>{inr(order.codFee)}</span>
              </li>
            )}
            <li className="flex justify-between font-display text-xl">
              <span>{TOTAL_LABEL}</span>
              <span>{inr(order.total)}</span>
            </li>
            {order.status !== "cancelled" && order.status !== "delivered" && (
              <li className="text-sm font-semibold text-sage-deep">📦 Arriving by {deliveryBy(order.createdAt)}</li>
            )}
          </ul>
        </div>
        <div className="rounded-[1.75rem] border border-line bg-paper/70 p-6 text-sm">
          <p className="eyebrow">Delivering to</p>
          <p className="mt-3 font-bold">{order.customerName}</p>
          <p className="text-ink-soft">+91 {order.phone}</p>
          <p className="mt-2 text-ink-soft">
            {order.address}
            <br />
            {order.city}, {order.state} – {order.pincode}
          </p>
          <p className="mt-3 inline-block rounded-full bg-sage px-3 py-1 text-xs font-extrabold">
            {cancelled ? "Cancelled" : isUpi ? "UPI · " + (settled ? "paid" : utr ? "UTR submitted" : "awaiting payment") : "Cash on Delivery"}
          </p>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-ink-soft">
        <Link href={`/track?code=${order.code}`} className="font-bold underline">Track this order</Link> anytime with your order ID and mobile number ·{" "}
        <Link href="/shop" className="font-bold underline">Continue shopping</Link>
      </p>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
