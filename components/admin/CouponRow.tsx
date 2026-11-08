"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Coupon } from "@/lib/coupons";
import { REFERRAL_REWARD, inr, rewardFor } from "@/lib/store";

/** One discount code: what it does, how often it has been used, and switching it on or off. */
export function CouponRow({ coupon: c, label, expires, expired }: { coupon: Coupon; label: string; expires: string | null; expired: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const call = async (init: RequestInit) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, init);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "That didn't save.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't save.");
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  };

  const toggle = () =>
    call({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ active: !c.active }) });

  const reward = rewardFor(c.code);
  const usedUp = c.maxUses != null && c.usedCount >= c.maxUses;
  const state = !c.active ? "Off" : expired ? "Expired" : usedUp ? "Used up" : "Live";
  const conditions = [
    c.minOrder > 0 && `on orders of ${inr(c.minOrder)}+`,
    expires && `${expired ? "ended" : "until"} ${expires}`,
    reward && `only for numbers that ${reward.earnedBy === "feedback" ? "filled in the feedback form" : "reviewed a piece"}, within ${reward.days} days`,
    c.code === REFERRAL_REWARD.code &&
      `only for customers whose referred friend's first order was delivered: one use per friend, within ${REFERRAL_REWARD.days} days`,
    c.oncePerPhone && "once per customer",
  ].filter(Boolean);

  return (
    <li className={`flex flex-wrap items-center gap-4 px-5 py-4 ${state === "Live" ? "" : "bg-cream/70"}`}>
      <div className="min-w-0 flex-1 basis-56">
        <p className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-dashed border-ink/40 px-2 py-0.5 font-mono text-base font-bold tracking-wide">{c.code}</span>
          <span className="font-bold">{label}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-extrabold ${
              state === "Live" ? "bg-sage" : state === "Off" ? "bg-line text-ink-soft" : "bg-butter"
            }`}
          >
            {state}
          </span>
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          {c.maxUses != null ? `Used ${c.usedCount} of ${c.maxUses}` : `Used ${c.usedCount} ${c.usedCount === 1 ? "time" : "times"}`}
          {conditions.length ? ` · ${conditions.join(" · ")}` : ""}
        </p>
        {error && <p role="alert" className="mt-1 text-sm font-bold text-[#a0573f]">{error}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {confirmDelete ? (
          <>
            <button disabled={busy} onClick={() => call({ method: "DELETE" })} className="rounded-full bg-[#a0573f] px-4 py-2 text-sm font-bold text-paper disabled:opacity-60">
              Delete {c.code}
            </button>
            <button onClick={() => setConfirmDelete(false)} className="rounded-full border border-line px-4 py-2 text-sm font-bold">Keep</button>
          </>
        ) : (
          <>
            {c.usedCount === 0 && !reward && c.code !== REFERRAL_REWARD.code && (
              <button onClick={() => setConfirmDelete(true)} className="px-2 text-sm font-bold text-[#a0573f] underline underline-offset-4">
                Delete
              </button>
            )}
            <button
              disabled={busy}
              onClick={toggle}
              className={`w-28 rounded-full px-4 py-2 text-sm font-bold transition-colors disabled:opacity-60 ${
                c.active ? "bg-ink text-paper" : "border border-line bg-paper text-ink-soft"
              }`}
            >
              {c.active ? "Switch off" : "Switch on"}
            </button>
          </>
        )}
      </div>
    </li>
  );
}
