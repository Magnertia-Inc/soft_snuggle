"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { FlowerMark } from "../art/FlowerMark";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <section className="shell pb-24">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-8 py-14 text-paper sm:px-14 sm:py-16">
        <motion.div
          className="absolute -right-16 -top-16 opacity-20"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <FlowerMark className="h-72 w-72" petal="#B7CCBE" center="#F1D47A" />
        </motion.div>
        <div className="relative grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
              A little note <em className="text-peach">from us?</em>
            </h2>
            <p className="mt-3 max-w-md text-paper/75">New little things, thoughtful tips and 10% off your first order.</p>
          </div>
          <AnimatePresence mode="wait">
            {state === "done" ? (
              <motion.p
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-full bg-paper/10 px-6 py-4 font-display text-xl"
              >
                You&apos;re in! Look out for a hello in your inbox 💌
              </motion.p>
            ) : (
              <motion.form key="form" onSubmit={submit} className="flex flex-col gap-3 sm:flex-row" exit={{ opacity: 0 }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 rounded-full border border-paper/20 bg-paper/10 px-6 py-4 text-paper outline-none placeholder:text-paper/50 focus:border-paper/60"
                />
                <button
                  disabled={state === "sending"}
                  className="rounded-full bg-paper px-7 py-4 font-bold text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {state === "sending" ? "Joining…" : "Join the list"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
        {state === "error" && <p className="relative mt-3 text-sm text-peach">Something went wrong. Please try again.</p>}
      </div>
    </section>
  );
}
