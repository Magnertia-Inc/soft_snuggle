"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = "pending" | "approved" | "hidden";

/** Approve (show on the product page), hide, or put back to waiting. */
export function ReviewActions({ id, status }: { id: number; status: Status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = async (to: Status) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: to }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "That didn't save.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't save.");
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "approved" && (
        <button disabled={busy} onClick={() => set("approved")} className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-paper disabled:opacity-50">
          {status === "hidden" ? "Show it" : "Approve"}
        </button>
      )}
      {status !== "hidden" && (
        <button disabled={busy} onClick={() => set("hidden")} className="rounded-full border border-line bg-paper px-4 py-2 text-sm font-bold disabled:opacity-50">
          Hide
        </button>
      )}
      {error && <span role="alert" className="text-sm font-bold text-[#a0573f]">{error}</span>}
    </div>
  );
}
