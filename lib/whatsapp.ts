import { SHIPPING_LABEL, STORE, inr } from "./store";
import type { Order } from "./types";

/** The pre-filled message the customer sends to the owner after ordering. */
export function orderMessage(order: Order, utr?: string | null, trackUrl?: string) {
  const lines: string[] = [];
  lines.push(`Hi ${STORE.name}! 👋`);
  if (order.paymentMethod === "upi") {
    lines.push(`I've paid *${inr(order.total)}* for my order *${order.code}*.`);
    if (utr) lines.push(`UPI UTR / Txn ID: *${utr}*`);
  } else {
    lines.push(`I've placed a *Cash on Delivery* order *${order.code}* for *${inr(order.total)}*.`);
  }
  lines.push("", "*Items*");
  for (const i of order.items) lines.push(`• ${i.name} (${i.colour ? `${i.colour}, ` : ""}${i.size}) × ${i.qty} — ${inr(i.price * i.qty)}`);
  lines.push("", `Subtotal: ${inr(order.subtotal)}`);
  if (order.discount > 0) lines.push(`Discount${order.couponCode ? ` (${order.couponCode})` : ""}: −${inr(order.discount)}`);
  lines.push(`${SHIPPING_LABEL}: ${order.shipping === 0 ? "Free" : inr(order.shipping)}`);
  if (order.codFee > 0) lines.push(`COD fee: ${inr(order.codFee)}`);
  lines.push(`*Total: ${inr(order.total)}* (${order.paymentMethod === "upi" ? "Paid via UPI" : "Cash on Delivery"})`);
  lines.push("", "*Deliver to*", `${order.customerName}, +91 ${order.phone}`, order.address, `${order.city}, ${order.state} – ${order.pincode}`);
  if (trackUrl) lines.push("", `Track: ${trackUrl}`);
  return lines.join("\n");
}

export function whatsappLink(text: string) {
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
