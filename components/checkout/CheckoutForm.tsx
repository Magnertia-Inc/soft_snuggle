"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { inr, shippingFor } from "@/lib/store";
import type { PaymentMethod } from "@/lib/types";
import { ProductThumb } from "../shop/ProductThumb";
import { useAccount } from "../providers/AccountProvider";
import { useCart } from "../providers/CartProvider";

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

const SAVED_KEY = "ss-customer-v1";

interface Details {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

const EMPTY: Details = { customerName: "", phone: "", email: "", address: "", city: "", state: "Tamil Nadu", pincode: "" };

export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, hydrated, clear } = useCart();
  const { customer, ready: accountReady } = useAccount();
  const [details, setDetails] = useState<Details>(EMPTY);
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const shipping = shippingFor(subtotal);
  const discount = coupon?.discount ?? 0;
  const total = subtotal - discount + shipping;

  const applyCoupon = async (code: string) => {
    if (!code.trim()) return;
    setCheckingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal, phone: details.phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "That code isn't valid.");
      setCoupon(data);
      setCouponInput(data.code);
    } catch (err) {
      setCoupon(null);
      setCouponError(err instanceof Error ? err.message : "That code isn't valid.");
    } finally {
      setCheckingCoupon(false);
    }
  };

  // The discount depends on what's in the bag, so it is worked out again if the bag changes.
  useEffect(() => {
    if (coupon) applyCoupon(coupon.code);
  }, [subtotal]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_KEY);
      if (saved) setDetails({ ...EMPTY, ...JSON.parse(saved) });
    } catch {}
  }, []);

  // An account fills in what we already know, without wiping anything typed.
  useEffect(() => {
    if (!customer) return;
    setDetails((d) => ({
      ...d,
      customerName: d.customerName || customer.name,
      phone: d.phone || customer.phone,
      email: d.email || customer.email || "",
      address: d.address || customer.address || "",
      city: d.city || customer.city || "",
      state: customer.state || d.state,
      pincode: d.pincode || customer.pincode || "",
    }));
  }, [customer]);

  const set = (k: keyof Details) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setDetails((d) => ({ ...d, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...details,
          paymentMethod: method,
          couponCode: coupon?.code ?? null,
          items: items.map((i) => ({ productId: i.productId, size: i.size, colour: i.colour, qty: i.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(details));
      } catch {}
      router.push(`/order/${data.code}?k=${data.accessKey}`);
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  if (hydrated && items.length === 0 && !submitting) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-5xl tracking-tight">
          Your bag is <em className="text-sage-deep">empty</em>
        </h1>
        <p className="mt-3 text-ink-soft">Add a few soft things first, then come back here.</p>
        <Link href="/shop" className="btn-primary mt-6">Browse the shop</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto grid max-w-7xl gap-10 px-6 pb-24 pt-28 sm:pt-32 lg:grid-cols-[1.25fr_1fr]">
      <div>
        <p className="eyebrow">Almost there</p>
        <h1 className="mt-3 font-display text-5xl tracking-tight sm:text-6xl">
          Check<em className="text-sage-deep">out</em>
        </h1>

        {accountReady && !customer && (
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-line bg-paper/70 px-5 py-4">
            <p className="text-sm text-ink-soft">
              Have an account? Log in and we&apos;ll fill this in for you.
            </p>
            <Link href="/login?next=/checkout" className="text-sm font-bold underline underline-offset-4">
              Log in →
            </Link>
          </div>
        )}

        {customer && (
          <p className="mt-7 rounded-[24px] bg-sage/60 px-5 py-4 text-sm font-semibold">
            Signed in as {customer.name}. This order will be saved to your account.
          </p>
        )}

        <Fieldset step="1" title="Who's it for?">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input className="field" required autoComplete="name" value={details.customerName} onChange={set("customerName")} />
            </Field>
            <Field label="Mobile number (WhatsApp)">
              <div className="flex">
                <span className="grid place-items-center rounded-l-[14px] border border-r-0 border-line bg-cream px-3 text-sm font-bold">+91</span>
                <input
                  className="field rounded-l-none"
                  required
                  inputMode="numeric"
                  autoComplete="tel-national"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  title="10-digit mobile number"
                  value={details.phone}
                  onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value.replace(/\D/g, "") }))}
                />
              </div>
            </Field>
            <Field label="Email (optional)" className="sm:col-span-2">
              <input className="field" type="email" autoComplete="email" value={details.email} onChange={set("email")} />
            </Field>
          </div>
        </Fieldset>

        <Fieldset step="2" title="Where should we send it?">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="House no., street, area, landmark" className="sm:col-span-2">
              <textarea className="field min-h-24 resize-none" required autoComplete="street-address" value={details.address} onChange={set("address")} />
            </Field>
            <Field label="City">
              <input className="field" required autoComplete="address-level2" value={details.city} onChange={set("city")} />
            </Field>
            <Field label="Pincode">
              <input
                className="field"
                required
                inputMode="numeric"
                pattern="[1-9][0-9]{5}"
                maxLength={6}
                title="6-digit pincode"
                autoComplete="postal-code"
                value={details.pincode}
                onChange={(e) => setDetails((d) => ({ ...d, pincode: e.target.value.replace(/\D/g, "") }))}
              />
            </Field>
            <Field label="State" className="sm:col-span-2">
              <select className="field" required value={details.state} onChange={set("state")}>
                {STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
        </Fieldset>

        <Fieldset step="3" title="How would you like to pay?">
          <div className="grid gap-3 sm:grid-cols-2">
            <PayOption
              active={method === "upi"}
              onClick={() => setMethod("upi")}
              title="Pay now with UPI"
              body="GPay, PhonePe, Paytm or any UPI app. Scan or tap to pay."
              tag="Fastest dispatch"
            />
            <PayOption
              active={method === "cod"}
              onClick={() => setMethod("cod")}
              title="Cash on Delivery"
              body="Pay in cash when your parcel arrives at your door."
            />
          </div>
          <p className="mt-4 rounded-2xl bg-sage/60 px-4 py-3 text-sm text-ink-soft">
            💬 After placing your order, we&apos;ll open WhatsApp with your order details ready to send to us — that&apos;s how we confirm it.
          </p>
        </Fieldset>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[32px] bg-paper p-6 shadow-[0_30px_60px_-40px_rgba(38,59,54,0.4)] sm:p-8">
          <h2 className="font-display text-2xl">Your order</h2>
          <ul className="mt-5 space-y-4">
            {items.map((i) => (
              <li key={`${i.productId}-${i.size}`} className="flex items-center gap-4">
                <div className="relative grid h-16 w-14 shrink-0 place-items-center rounded-xl" style={{ background: i.tint }}>
                  <span className="grid h-full w-full place-items-center overflow-hidden rounded-xl">
                    <ProductThumb image={i.image} category={i.category} garment={i.garment} className="h-12 w-12" />
                  </span>
                  <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-ink text-[0.7rem] font-bold text-paper">
                    {i.qty}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold leading-tight">{i.name}</p>
                  <p className="text-sm text-ink-soft">Size {i.size}</p>
                </div>
                <span className="font-bold">{inr(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-line pt-5">
            {coupon ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-sage/60 px-4 py-3 text-sm">
                <span>
                  <b>{coupon.code}</b> applied · {coupon.label}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCoupon(null);
                    setCouponInput("");
                  }}
                  className="font-bold underline underline-offset-4"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <label htmlFor="coupon" className="mb-1.5 block text-sm font-bold text-ink-soft">Discount code</label>
                <div className="flex gap-2">
                  <input
                    id="coupon"
                    className="field uppercase"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={20}
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter here applies the code rather than placing the order.
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyCoupon(couponInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={checkingCoupon || !couponInput.trim()}
                    onClick={() => applyCoupon(couponInput)}
                    className="btn-ghost shrink-0 px-5 disabled:opacity-50"
                  >
                    {checkingCoupon ? "Checking…" : "Apply"}
                  </button>
                </div>
                {couponError && <p role="alert" className="mt-2 text-sm font-semibold text-[#a0573f]">{couponError}</p>}
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
            <div className="flex justify-between text-ink-soft"><span>Subtotal</span><span className="text-ink">{inr(subtotal)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-ink-soft"><span>Discount ({coupon?.code})</span><span className="text-sage-deep font-bold">−{inr(discount)}</span></div>
            )}
            <div className="flex justify-between text-ink-soft"><span>Shipping</span><span className="text-ink">{shipping === 0 ? "Free" : inr(shipping)}</span></div>
            <div className="flex justify-between pt-2 font-display text-2xl"><span>Total</span><span>{inr(total)}</span></div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 rounded-2xl bg-peach px-4 py-3 text-sm font-semibold"
                role="alert"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button type="submit" disabled={submitting || !hydrated} className="btn-primary mt-6 w-full py-4 text-base">
            {submitting ? "Placing your order…" : method === "upi" ? `Continue to pay · ${inr(total)}` : `Place COD order · ${inr(total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-ink-soft">
            By placing an order you agree to our <Link href="/policies/terms" className="underline">terms</Link> and{" "}
            <Link href="/policies/returns" className="underline">exchange policy</Link>.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Fieldset({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <motion.fieldset
      className="mt-10"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Number(step) * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <legend className="mb-5 flex items-center gap-3 font-display text-2xl">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-sage font-sans text-sm font-extrabold">{step}</span>
        {title}
      </legend>
      {children}
    </motion.fieldset>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-sm font-bold text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

function PayOption({ active, onClick, title, body, tag }: { active: boolean; onClick: () => void; title: string; body: string; tag?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-[22px] border-2 p-5 text-left transition-all ${
        active ? "border-ink bg-paper shadow-[0_16px_40px_-24px_rgba(38,59,54,0.5)]" : "border-line bg-paper/60 hover:border-ink/30"
      }`}
      aria-pressed={active}
    >
      <span className={`absolute right-5 top-5 grid h-5 w-5 place-items-center rounded-full border-2 ${active ? "border-ink" : "border-line"}`}>
        {active && <motion.span layoutId="pay-dot" className="h-2.5 w-2.5 rounded-full bg-ink" />}
      </span>
      <span className="block font-display text-xl">{title}</span>
      <span className="mt-1 block pr-6 text-sm text-ink-soft">{body}</span>
      {tag && <span className="mt-3 inline-block rounded-full bg-butter px-2.5 py-0.5 text-xs font-extrabold">{tag}</span>}
    </button>
  );
}
