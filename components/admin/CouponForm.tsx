"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const EMPTY = {
  code: "",
  kind: "percent" as "percent" | "flat",
  value: "",
  minOrder: "",
  maxDiscount: "",
  expiresOn: "",
  maxUses: "",
  oncePerPhone: false,
};

const digits = (v: string) => v.replace(/\D/g, "");

/** Creates a discount code. Starts folded, so the list of codes stays the focus of the page. */
export function CouponForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setF((x) => ({ ...x, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "That didn't save.");
      setCreated(data.code);
      setF(EMPTY);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't save.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => { setOpen(true); setCreated(null); }} className="btn-primary">+ New code</button>
        {created && <p className="text-sm font-bold text-sage-deep">{created} is live. Shoppers can use it now.</p>}
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  return (
    <form onSubmit={submit} className="rounded-[24px] border border-line bg-paper p-5 sm:p-6">
      <h2 className="font-display text-2xl">New code</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Code" hint="What shoppers type, e.g. WELCOME10.">
          <input
            className="field font-mono uppercase"
            required
            maxLength={20}
            autoComplete="off"
            spellCheck={false}
            value={f.code}
            onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
          />
        </Field>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-bold text-ink-soft">Takes off</legend>
          <div className="flex gap-2">
            <div className="flex shrink-0 overflow-hidden rounded-[14px] border border-line">
              {(["percent", "flat"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set("kind", k)}
                  aria-pressed={f.kind === k}
                  className={`px-3.5 text-sm font-bold ${f.kind === k ? "bg-ink text-paper" : "bg-paper text-ink-soft"}`}
                >
                  {k === "percent" ? "%" : "₹"}
                </button>
              ))}
            </div>
            <input
              className="field"
              required
              inputMode="numeric"
              aria-label={f.kind === "percent" ? "Percent off" : "Rupees off"}
              placeholder={f.kind === "percent" ? "10" : "100"}
              value={f.value}
              onChange={(e) => set("value", digits(e.target.value))}
            />
          </div>
        </fieldset>

        {f.kind === "percent" && (
          <Field label="Most it takes off (₹, optional)" hint="A cap, so 10% of a big order stays sensible.">
            <input className="field" inputMode="numeric" value={f.maxDiscount} onChange={(e) => set("maxDiscount", digits(e.target.value))} />
          </Field>
        )}

        <Field label="Minimum order (₹, optional)" hint="Items total before the code works.">
          <input className="field" inputMode="numeric" value={f.minOrder} onChange={(e) => set("minOrder", digits(e.target.value))} />
        </Field>

        <Field label="Last day (optional)" hint="Works until midnight that day. Empty: no end date.">
          <input className="field" type="date" min={today} value={f.expiresOn} onChange={(e) => set("expiresOn", e.target.value)} />
        </Field>

        <Field label="Total uses (optional)" hint="e.g. 50 for the first 50 orders. Empty: no limit.">
          <input className="field" inputMode="numeric" value={f.maxUses} onChange={(e) => set("maxUses", digits(e.target.value))} />
        </Field>

        <label className="flex items-center gap-2.5 text-sm font-bold sm:col-span-2 lg:col-span-3">
          <input type="checkbox" className="h-4 w-4 accent-[#263B36]" checked={f.oncePerPhone} onChange={(e) => set("oncePerPhone", e.target.checked)} />
          Once per customer (checked by mobile number)
        </label>
      </div>

      {error && <p role="alert" className="mt-4 text-sm font-bold text-[#a0573f]">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Creating…" : "Create code"}</button>
        <button type="button" onClick={() => { setOpen(false); setError(null); }} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}
