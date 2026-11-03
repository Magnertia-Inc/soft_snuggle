import { adminEmails } from "./admin";
import { sendMail } from "./mail";
import { STORE, inr, whatsappDisplay } from "./store";
import type { Order } from "./types";

// One email per order, to the admins and (when they gave an address) the
// customer, sent once the order is real:
//   Cash on delivery  as soon as it is placed
//   UPI               when the customer enters their UTR, i.e. says they've paid
// A UPI order that never gets a UTR sends nothing: nobody has paid for it.
// If a customer corrects their UTR, the admins get a short "UTR changed" email;
// the customer isn't emailed twice.

export type OrderMoment = "cod_placed" | "utr_submitted" | "utr_changed";

/**
 * The site's public address for links in emails. Taken from configuration
 * rather than the request, so a forged Host header can't put someone else's
 * link into an email.
 */
export function emailSiteUrl(fallback: string) {
  const configured = process.env.SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return fallback;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const INK = "#263B36";
const SOFT = "#5E6F69";
const LINE = "#E6E0D4";

function layout(title: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#F6F1E8;font-family:Arial,Helvetica,sans-serif;color:${INK}">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#FDFBF6;border-radius:20px;padding:28px 24px;border:1px solid ${LINE}">
<p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${SOFT}">Soft Snuggle</p>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">${title}</h1>
${body}
</div>
<p style="margin:16px 0 0;text-align:center;font-size:12px;color:${SOFT}">Soft Snuggle · Little clothes, lots of love</p>
</div></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:20px 0 0"><a href="${esc(href)}" style="display:inline-block;background:${INK};color:#FDFBF6;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">${esc(label)}</a></p>`;

function itemsTable(order: Order) {
  const row = (left: string, right: string, strong = false) =>
    `<tr><td style="padding:6px 0;${strong ? "font-weight:bold;font-size:16px" : ""}">${left}</td><td style="padding:6px 0;text-align:right;${strong ? "font-weight:bold;font-size:16px" : ""}">${right}</td></tr>`;
  const items = order.items
    .map((i) => row(`${esc(i.name)}<br><span style="color:${SOFT};font-size:13px">${i.colour ? `${esc(i.colour)} · ` : ""}${esc(i.size)} × ${i.qty}</span>`, inr(i.price * i.qty)))
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};margin:12px 0">
${items}
<tr><td colspan="2" style="border-top:1px solid ${LINE}"></td></tr>
${row(`<span style="color:${SOFT}">Subtotal</span>`, inr(order.subtotal))}
${order.discount > 0 ? row(`<span style="color:${SOFT}">Discount${order.couponCode ? ` (${esc(order.couponCode)})` : ""}</span>`, `−${inr(order.discount)}`) : ""}
${row(`<span style="color:${SOFT}">Delivery</span>`, order.shipping === 0 ? "Free" : inr(order.shipping))}
${row("Total", inr(order.total), true)}
</table>`;
}

function itemsText(order: Order) {
  return [
    ...order.items.map((i) => `- ${i.name} (${i.colour ? `${i.colour}, ` : ""}${i.size}) × ${i.qty}: ${inr(i.price * i.qty)}`),
    `Subtotal: ${inr(order.subtotal)}`,
    ...(order.discount > 0 ? [`Discount${order.couponCode ? ` (${order.couponCode})` : ""}: −${inr(order.discount)}`] : []),
    `Delivery: ${order.shipping === 0 ? "Free" : inr(order.shipping)}`,
    `Total: ${inr(order.total)}`,
  ].join("\n");
}

const address = (o: Order) => `${o.address}, ${o.city}, ${o.state} – ${o.pincode}`;

function ownerMail(order: Order, moment: OrderMoment, site: string) {
  const adminLink = `${site}/admin/orders/${order.code}`;
  const wa = `https://wa.me/91${order.phone}`;
  const subject =
    moment === "cod_placed"
      ? `New COD order ${order.code} · ${inr(order.total)} · ${order.city}`
      : moment === "utr_submitted"
        ? `New order ${order.code} · ${inr(order.total)} paid by UPI · UTR ${order.utr}`
        : `${order.code}: UTR changed to ${order.utr}`;

  const lead =
    moment === "cod_placed"
      ? `<b>Cash on delivery.</b> Collect <b>${inr(order.total)}</b> when it's delivered. Confirm the order with the customer on WhatsApp.`
      : moment === "utr_submitted"
        ? `<b>The customer says they paid ${inr(order.total)} by UPI.</b> UTR <b style="font-family:monospace;font-size:15px">${esc(order.utr ?? "")}</b>. Check it has reached the bank account, then confirm the order in the admin panel.`
        : `The customer changed their UPI reference. The new UTR is <b style="font-family:monospace;font-size:15px">${esc(order.utr ?? "")}</b> for <b>${inr(order.total)}</b>. Check this one against the bank account.`;

  const html = layout(
    moment === "utr_changed" ? `UTR changed on ${order.code}` : `New order ${order.code}`,
    `<p style="margin:0;font-size:15px;line-height:1.5">${lead}</p>
${itemsTable(order)}
<p style="margin:0;font-size:14px;line-height:1.6"><b>${esc(order.customerName)}</b><br>
<a href="tel:+91${esc(order.phone)}" style="color:${INK}">+91 ${esc(order.phone)}</a> · <a href="${esc(wa)}" style="color:${INK}">WhatsApp</a>${order.email ? `<br>${esc(order.email)}` : ""}<br>
<span style="color:${SOFT}">${esc(address(order))}</span></p>
${button(adminLink, "Open the order")}`,
  );

  const text = [
    subject,
    "",
    moment === "cod_placed"
      ? `Cash on delivery: collect ${inr(order.total)}.`
      : `UPI: ${inr(order.total)}, UTR ${order.utr}. Check the bank account before confirming.`,
    "",
    itemsText(order),
    "",
    `${order.customerName}, +91 ${order.phone}${order.email ? `, ${order.email}` : ""}`,
    address(order),
    "",
    `Open the order: ${adminLink}`,
  ].join("\n");

  return { to: adminEmails(), subject, html, text };
}

function customerMail(order: Order, site: string) {
  const orderLink = `${site}/order/${order.code}?k=${order.accessKey}`;
  const wa = `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(`Hi Soft Snuggle! About my order ${order.code}`)}`;
  const subject = `Thank you! We've got your order ${order.code}`;
  const upi = order.paymentMethod === "upi";
  const payment = upi
    ? `We've received your payment details: <b>${inr(order.total)}</b> by UPI, UTR <b style="font-family:monospace">${esc(order.utr ?? "")}</b>. We'll confirm on WhatsApp as soon as it shows in our account, then pack your order.`
    : `You chose cash on delivery: please keep <b>${inr(order.total)}</b> ready when your parcel arrives. We'll confirm your order on WhatsApp.`;

  const html = layout(
    `Thank you, ${esc(order.customerName.split(" ")[0])}!`,
    `<p style="margin:0 0 8px;font-size:15px;line-height:1.5">We've got your order <b>${order.code}</b>.</p>
<p style="margin:0;font-size:15px;line-height:1.5">${payment}</p>
${itemsTable(order)}
<p style="margin:0;font-size:14px;line-height:1.6"><b>Delivering to</b><br>${esc(order.customerName)}, +91 ${esc(order.phone)}<br>
<span style="color:${SOFT}">${esc(address(order))}</span></p>
${button(orderLink, "See your order")}
<p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:${SOFT}">Questions? Message us on WhatsApp at <a href="${esc(wa)}" style="color:${INK}">${whatsappDisplay}</a>. You can follow your order any time at <a href="${esc(`${site}/track`)}" style="color:${INK}">${esc(site.replace(/^https?:\/\//, ""))}/track</a>.</p>`,
  );

  const text = [
    `Thank you, ${order.customerName}! We've got your order ${order.code}.`,
    "",
    upi
      ? `Payment details received: ${inr(order.total)} by UPI, UTR ${order.utr}. We'll confirm on WhatsApp once it shows in our account.`
      : `Cash on delivery: please keep ${inr(order.total)} ready when your parcel arrives.`,
    "",
    itemsText(order),
    "",
    `Delivering to: ${order.customerName}, +91 ${order.phone}`,
    address(order),
    "",
    `See your order: ${orderLink}`,
    `Questions? WhatsApp ${whatsappDisplay}`,
  ].join("\n");

  return { to: [order.email!], subject, html, text };
}

/** Sends the emails for one moment in an order's life. Never throws. */
export async function sendOrderEmails(order: Order, moment: OrderMoment, site: string) {
  try {
    await sendMail(ownerMail(order, moment, site));
    if (order.email && moment !== "utr_changed") await sendMail(customerMail(order, site));
  } catch (err) {
    console.error(`order emails for ${order.code} failed`, err);
  }
}
