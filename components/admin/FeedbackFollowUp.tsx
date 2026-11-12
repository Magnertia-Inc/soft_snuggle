"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FEEDBACK_STATUSES, type FeedbackStatus } from "@/lib/feedback-statuses";

/** The shop's follow-up on one piece of feedback: status and a private note. */
export function FeedbackFollowUp({ code, status: initialStatus, note: initialNote }: { code: string; status: FeedbackStatus; note: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState(initialNote ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = status !== initialStatus || note.trim() !== (initialNote ?? "");

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/feedback/${code}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "That didn't save.");
      setMsg({ ok: true, text: "Saved." });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "That didn't save." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
      <label className="sr-only" htmlFor={`status-${code}`}>Follow-up status for {code}</label>
      <select
        id={`status-${code}`}
        value={status}
        onChange={(e) => setStatus(e.target.value as FeedbackStatus)}
        className="rounded-full border border-line bg-paper px-3 py-2 text-sm font-bold"
      >
        {FEEDBACK_STATUSES.map((s) => (
          <option key={s.key} value={s.key}>{s.label}</option>
        ))}
      </select>
      <label className="sr-only" htmlFor={`note-${code}`}>Private note for {code}</label>
      <input
        id={`note-${code}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={1000}
        placeholder="Private note, e.g. called, sending a replacement"
        className="min-w-0 flex-1 basis-56 rounded-full border border-line bg-paper px-4 py-2 text-sm"
      />
      <button disabled={busy || !dirty} onClick={save} className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-paper disabled:opacity-40">
        {busy ? "Saving…" : "Save"}
      </button>
      {msg && <span role="status" className={`text-sm font-bold ${msg.ok ? "text-sage-deep" : "text-[#a0573f]"}`}>{msg.text}</span>}
    </div>
  );
}
