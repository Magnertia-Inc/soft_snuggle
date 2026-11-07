"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { STORE } from "@/lib/store";
import { CopyButton } from "./CopyButton";

interface Props {
  code: string;
  customerName: string;
  phone: string;
  email: string | null;
  /** The customer's feedback page */
  link: string;
  /** When the email goes out by itself, if it hasn't yet */
  mailDueAt: string | null;
  mailedAt: string | null;
  rating: number | null;
}

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** On a delivered order: where the feedback request stands, and ways to send it now. */
export function FeedbackPanel({ code, customerName, phone, email, link, mailDueAt, mailedAt, rating }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const message =
    `Hi ${customerName.split(" ")[0]}! We hope your ${STORE.name} order ${code} reached you safely. ` +
    `Could you tell us how it went? It takes a minute, and you'll get 5% off your next order:\n${link}`;

  const emailNow = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${code}/feedback-mail`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "That didn't send.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't send.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="text-sm">
      {rating != null ? (
        <p>
          Rated <b className="text-[#E0A526]">{"★".repeat(rating)}</b>
          <span className="text-line">{"★".repeat(5 - rating)}</span> ·{" "}
          <Link href={`/admin/feedback#${code}`} className="font-bold underline underline-offset-4">See their answers</Link>
        </p>
      ) : mailedAt ? (
        <p>Feedback email sent {when(mailedAt)}. No answer yet.</p>
      ) : email && mailDueAt ? (
        <p>The feedback email goes to {email} around <b>{when(mailDueAt)}</b> (sent between 9 am and 8 pm).</p>
      ) : (
        <p>No email address on this order, so send the feedback link on WhatsApp.</p>
      )}
      {rating == null && (
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-sage px-4 py-2 font-bold"
          >
            Send link on WhatsApp
          </a>
          {email && (
            <button disabled={busy} onClick={emailNow} className="rounded-full border border-line bg-paper px-4 py-2 font-bold disabled:opacity-60">
              {busy ? "Sending…" : mailedAt ? "Email it again" : "Email it now"}
            </button>
          )}
          <CopyButton text={link} label="Copy link" />
        </div>
      )}
      {error && <p role="alert" className="mt-2 font-bold text-[#a0573f]">{error}</p>}
    </div>
  );
}
