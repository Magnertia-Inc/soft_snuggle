import Link from "next/link";
import type { AdminOrderRow } from "@/lib/admin-queries";
import { STATUS_LABELS, STATUS_TONES, paymentLabel, paymentNeedsLook, when } from "@/lib/admin-labels";
import { inr } from "@/lib/store";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-[0.6875rem] font-extrabold uppercase tracking-[0.1em] ${STATUS_TONES[status] ?? "bg-line"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/** Orders as rows on a computer, as cards on a phone. Each opens the order. */
export function OrderList({ orders, empty = "No orders here." }: { orders: AdminOrderRow[]; empty?: string }) {
  if (orders.length === 0) {
    return <p className="rounded-[1.5rem] border border-line bg-paper/70 p-10 text-center text-ink-soft">{empty}</p>;
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-[1.5rem] border border-line bg-paper">
      <li className="hidden grid-cols-[7rem_1fr_6rem_6rem_10rem_8.5rem] gap-4 bg-cream/60 px-5 py-3 text-[0.6875rem] font-extrabold uppercase tracking-[0.14em] text-ink-soft lg:grid">
        <span>Order</span>
        <span>Customer</span>
        <span>Items</span>
        <span className="text-right">Total</span>
        <span>Payment</span>
        <span>Status</span>
      </li>
      {orders.map((o) => (
        <li key={o.code}>
          <Link
            href={`/admin/orders/${o.code}`}
            className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-sage/30 lg:grid-cols-[7rem_1fr_6rem_6rem_10rem_8.5rem] lg:items-center"
          >
            <span>
              <span className="block font-bold">{o.code}</span>
              <span className="block text-xs text-ink-soft">{when(o.placedAt)}</span>
            </span>
            <span className="order-first col-span-2 min-w-0 lg:order-none lg:col-span-1">
              <span className="block truncate font-bold lg:font-semibold">{o.customerName}</span>
              <span className="block truncate text-xs text-ink-soft">+91 {o.phone} · {o.city}</span>
            </span>
            <span className="hidden text-sm text-ink-soft lg:block">{o.itemCount} {o.itemCount === 1 ? "piece" : "pieces"}</span>
            <span className="text-right font-bold">{inr(o.total)}</span>
            <span className={`text-sm ${paymentNeedsLook(o.paymentMethod, o.paymentStatus) && o.status === "new" ? "font-bold text-[#a0573f]" : "text-ink-soft"}`}>
              {paymentLabel(o.paymentMethod, o.paymentStatus)}
            </span>
            <span className="text-right lg:text-left">
              <StatusBadge status={o.status} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
