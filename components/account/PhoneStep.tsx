"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { FlowerMark } from "../art/FlowerMark";
import { useAccount } from "../providers/AccountProvider";

/** Second half of a first Google sign-in: name (from Google, editable) and mobile number. */
export function PhoneStep({ name: googleName, email, next }: { name: string; email: string; next: string }) {
  const router = useRouter();
  const { refresh } = useAccount();
  const [name, setName] = useState(googleName);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/google/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "That didn't work. Please try again.");
        setExpired(!!data.expired);
        return;
      }
      await refresh();
      router.push(next);
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full rounded-2xl border border-line bg-paper px-4 py-3.5 outline-none transition-colors focus:border-ink/40";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="text-center">
        <FlowerMark className="anim-float mx-auto h-11 w-11" />
        <h1 className="mt-5 font-display text-4xl tracking-tight sm:text-5xl">One last thing</h1>
        <p className="mt-2 text-ink-soft">
          Your mobile number, for delivery and WhatsApp. We only ask once.
        </p>
        <p className="mt-3 inline-block rounded-full bg-sage/70 px-4 py-1.5 text-sm">Signed in with Google as <b>{email}</b></p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-3">
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          className={field}
          required
        />
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-paper pl-4 focus-within:border-ink/40">
          <span className="text-ink-soft">+91</span>
          <input
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Mobile number (WhatsApp)"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={13}
            className="w-full bg-transparent py-3.5 pr-4 outline-none"
            required
            autoFocus
          />
        </div>
        <p className="px-1 text-xs text-ink-soft">
          It&apos;s verified when your first order reaches us on WhatsApp from this number.
        </p>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-rose/25 px-4 py-3 text-sm font-semibold"
            >
              {error}{" "}
              {expired && (
                <a href={`/api/auth/google?next=${encodeURIComponent(next)}`} className="underline underline-offset-4">
                  Continue with Google
                </a>
              )}
            </motion.p>
          )}
        </AnimatePresence>

        <button type="submit" disabled={busy} className="btn-primary w-full py-4 disabled:opacity-60">
          {busy ? "One moment…" : "Finish"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Not you?{" "}
        <Link href="/login" className="font-bold text-ink underline underline-offset-4">
          Use another way to log in
        </Link>
      </p>
    </div>
  );
}
