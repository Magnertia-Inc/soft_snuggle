"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { phoneDigits } from "@/lib/store";
import { FlowerMark } from "../art/FlowerMark";
import { useAccount } from "../providers/AccountProvider";
import { GoogleButton } from "./GoogleButton";
import { ChannelCTA } from "../ChannelCTA";

type Mode = "login" | "signup";

/** google: whether "Continue with Google" is set up. notice: why the last Google sign-in failed. */
export function AuthForm({ google = false, notice = null }: { google?: boolean; notice?: string | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";
  const { login, signup } = useAccount();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(notice);
  // Consent to the Terms & Conditions and Privacy policy, needed for every way in
  const [agreed, setAgreed] = useState(false);
  const needConsent = () => setError("Please agree to the Terms & Conditions to continue.");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return needConsent();
    setBusy(true);
    setError(null);
    const message =
      mode === "login" ? await login(phone, password) : await signup({ name, phone, email, password });
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    router.push(next);
    router.refresh();
  };

  const field = "w-full rounded-2xl border border-line bg-paper px-4 py-3.5 outline-none transition-colors focus:border-ink/40";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="text-center">
        <FlowerMark className="anim-float mx-auto h-11 w-11" />
        <h1 className="mt-5 font-display text-4xl tracking-tight sm:text-5xl">
          {mode === "login" ? "Welcome back" : "Hello there"}
        </h1>
        <p className="mt-2 text-ink-soft">
          {mode === "login"
            ? "Your bag, your saved pieces and every order, all in one place."
            : "An account keeps your saved pieces and your orders together."}
        </p>
      </div>

      <label className="mt-8 flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-paper px-4 py-3.5 text-sm">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => {
            setAgreed(e.target.checked);
            if (e.target.checked) setError(null);
          }}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#263B36]"
        />
        <span className="text-ink-soft">
          I agree to Veviba&apos;s{" "}
          <a href="/policies/terms" target="_blank" className="font-bold text-ink underline underline-offset-2">
            Terms &amp; Conditions
          </a>{" "}
          and{" "}
          <a href="/policies/privacy" target="_blank" className="font-bold text-ink underline underline-offset-2">
            Privacy policy
          </a>
          .
        </span>
      </label>

      {google && (
        <div className="mt-4">
          <GoogleButton next={next} disabled={!agreed} onBlocked={needConsent} />
          <div className="mt-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
            <span className="h-px flex-1 bg-line" />
            or with your mobile number
            <span className="h-px flex-1 bg-line" />
          </div>
        </div>
      )}

      <form onSubmit={submit} className={`${google ? "mt-6" : "mt-4"} space-y-3`}>
        <AnimatePresence initial={false}>
          {mode === "signup" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <input
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className={field}
                required={mode === "signup"}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 rounded-2xl border border-line bg-paper pl-4 focus-within:border-ink/40">
          <span className="text-ink-soft">+91</span>
          <input
            name="phone"
            value={phone}
            onChange={(e) => setPhone(phoneDigits(e.target.value))}
            placeholder="Mobile number"
            inputMode="numeric"
            autoComplete="tel"
            className="w-full bg-transparent py-3.5 pr-4 outline-none"
            required
          />
        </div>

        <AnimatePresence initial={false}>
          {mode === "signup" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <input
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional)"
                type="email"
                autoComplete="email"
                className={field}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center rounded-2xl border border-line bg-paper pr-3 focus-within:border-ink/40">
          <input
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "login" ? "Password" : "Create a password"}
            type={show ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full bg-transparent px-4 py-3.5 outline-none"
            required
          />
          <button type="button" onClick={() => setShow((v) => !v)} className="shrink-0 text-xs font-bold text-ink-soft hover:text-ink">
            {show ? "Hide" : "Show"}
          </button>
        </div>

        {mode === "signup" && <p className="px-1 text-xs text-ink-soft">At least 6 characters.</p>}

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-rose/25 px-4 py-3 text-sm font-semibold"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button type="submit" disabled={busy} className="btn-primary w-full py-4 disabled:opacity-60">
          {busy ? "One moment…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        {mode === "login" ? "First time here?" : "Already have an account?"}{" "}
        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="font-bold text-ink underline underline-offset-4"
        >
          {mode === "login" ? "Create an account" : "Log in"}
        </button>
      </p>

      <p className="mt-3 text-center text-sm text-ink-soft">
        Or just{" "}
        <Link href="/shop" className="font-bold text-ink underline underline-offset-4">
          keep shopping
        </Link>{" "}
        and log in when you&apos;re ready to order.
      </p>

      <ChannelCTA
        className="mt-6"
        title="Coupons on every purchase"
        text="Be the first to get new drops and coupon codes."
      />

      <p className="mt-6 text-center text-xs text-ink-soft">
        Forgotten your password? Message us on WhatsApp and we&apos;ll sort it out.
      </p>
    </div>
  );
}
