"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { COURIERS } from "@/lib/admin-labels";

interface Props {
  code: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  utr: string | null;
  courier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
}

type Panel = null | "ship" | "tracking" | "cancel";

/** The buttons for whatever comes next with this order, and the note box. */
export function OrderActions(o: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [courier, setCourier] = useState(o.courier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(o.trackingNumber ?? "");
  const [trackingUrl, setTrackingUrl] = useState(o.trackingUrl ?? "");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const run = async (action: string, extra: Record<string, string> = {}) => {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${o.code}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "That didn't save. Please try again.");
        return false;
      }
      setPanel(null);
      router.refresh();
      return true;
    } catch {
      setError("No connection. Check the internet and try again.");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const unpaidUpi = o.paymentMethod === "upi" && o.paymentStatus === "pending";
  const btn = "btn-primary w-full !py-3";
  const quiet = "w-full rounded-full border border-line bg-paper px-5 py-3 text-sm font-bold hover:border-ink/40 disabled:opacity-50";

  const shipForm = (action: "ship" | "tracking") => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(action, { courier, trackingNumber, trackingUrl });
      }}
      className="space-y-2.5 rounded-[1.25rem] bg-cream p-4"
    >
      <label className="block text-sm font-bold">
        Courier
        <input list="couriers" value={courier} onChange={(e) => setCourier(e.target.value)} required className="field mt-1 !py-2.5" placeholder="e.g. Delhivery" />
      </label>
      <datalist id="couriers">{COURIERS.map((c) => <option key={c} value={c} />)}</datalist>
      <label className="block text-sm font-bold">
        Tracking / AWB number
        <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} required className="field mt-1 !py-2.5" />
      </label>
      <label className="block text-sm font-bold">
        Tracking link <span className="font-normal text-ink-soft">(optional)</span>
        <input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} type="url" className="field mt-1 !py-2.5" placeholder="https://" />
      </label>
      <p className="text-xs text-ink-soft">Without a link, the customer&apos;s tracking page searches for the number with the courier&apos;s name.</p>
      <button disabled={!!busy} className={btn}>{busy ? "Saving…" : action === "ship" ? "Mark shipped" : "Save tracking"}</button>
    </form>
  );

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="rounded-2xl bg-peach/70 px-4 py-3 text-sm">{error}</p>}

      {o.status === "new" && (
        <>
          {o.paymentMethod === "upi" && (
            <p className={`rounded-2xl px-4 py-3 text-sm ${unpaidUpi ? "bg-butter" : "bg-sage/60"}`}>
              {unpaidUpi
                ? "No UTR from the customer yet. Only confirm if you can see the payment in your bank."
                : <>Find UTR <b className="font-mono">{o.utr}</b> in your bank or UPI app before confirming.</>}
            </p>
          )}
          <button disabled={!!busy} onClick={() => run("confirm")} className={btn}>
            {busy === "confirm" ? "Confirming…" : o.paymentMethod === "upi" ? "Payment received · confirm order" : "Confirm order"}
          </button>
        </>
      )}

      {o.status === "confirmed" && (
        <button disabled={!!busy} onClick={() => run("pack")} className={btn}>{busy === "pack" ? "Saving…" : "Mark packed"}</button>
      )}

      {(o.status === "confirmed" || o.status === "packed") &&
        (panel === "ship" ? shipForm("ship") : (
          <button disabled={!!busy} onClick={() => setPanel("ship")} className={o.status === "packed" ? btn : quiet}>
            Ship it · add tracking
          </button>
        ))}

      {o.status === "shipped" && (
        <button disabled={!!busy} onClick={() => run("out_for_delivery")} className={quiet}>
          {busy === "out_for_delivery" ? "Saving…" : "Out for delivery"}
        </button>
      )}

      {(o.status === "shipped" || o.status === "out_for_delivery") && (
        <>
          <button disabled={!!busy} onClick={() => run("deliver")} className={btn}>{busy === "deliver" ? "Saving…" : "Mark delivered"}</button>
          {panel === "tracking" ? shipForm("tracking") : (
            <button onClick={() => setPanel("tracking")} className={quiet}>Change tracking details</button>
          )}
        </>
      )}

      {o.status === "delivered" && <p className="rounded-2xl bg-sage/60 px-4 py-3 text-sm">Delivered. Nothing left to do. 🎉</p>}

      {o.status === "cancelled" && (
        <button disabled={!!busy} onClick={() => run("reopen")} className={quiet}>{busy === "reopen" ? "Saving…" : "Reopen order"}</button>
      )}

      {o.status !== "delivered" && o.status !== "cancelled" &&
        (panel === "cancel" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run("cancel", { note: reason });
            }}
            className="space-y-2.5 rounded-[1.25rem] bg-cream p-4"
          >
            <label className="block text-sm font-bold">
              Why is it being cancelled?
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} required rows={2} className="field mt-1" placeholder="e.g. Customer asked, payment never came" />
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPanel(null)} className={quiet}>Keep order</button>
              <button disabled={!!busy} className="w-full rounded-full bg-[#a0573f] px-5 py-3 text-sm font-bold text-paper disabled:opacity-50">
                {busy === "cancel" ? "Cancelling…" : "Cancel order"}
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setPanel("cancel")} className="w-full py-2 text-sm font-bold text-[#a0573f] underline-offset-4 hover:underline">
            Cancel this order
          </button>
        ))}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run("note", { note })) setNote("");
        }}
        className="border-t border-line pt-4"
      >
        <label className="block text-sm font-bold">
          Add a note <span className="font-normal text-ink-soft">(only admins see it)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="field mt-1" placeholder="e.g. Called customer, will pay tonight" />
        </label>
        <button disabled={!!busy || !note.trim()} className={`${quiet} mt-2`}>{busy === "note" ? "Saving…" : "Save note"}</button>
      </form>
    </div>
  );
}
