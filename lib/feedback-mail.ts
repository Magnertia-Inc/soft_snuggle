import { getDb } from "./db";
import { rewardIsOn, type FeedbackAnswers } from "./feedback";
import { mailConfigured, sendMail } from "./mail";
import { INK, SOFT, button, esc, layout } from "./order-emails";
import { configuredSiteUrl } from "./site";
import {
  FEEDBACK_ASPECTS, FEEDBACK_MAIL_AFTER_DAYS, FEEDBACK_REWARD, IMPROVE_AREAS, RECOMMEND_ANSWERS, REVIEW_REWARD, STORE,
  whatsappDisplay,
} from "./store";

// The emails around feedback and reviews:
//   - "How was your order?", FEEDBACK_MAIL_AFTER_DAYS after "Mark delivered"
//     (or straight away from the admin order page), to customers who gave an email;
//   - the thank-you with FBK5 or RR5 once they send feedback or a review;
//   - a heads-up to the shop when an order is rated 1 or 2 stars.
// The invites are sent by a timer started in instrumentation.ts.

const STAR = "#E0A526";
const DAY = 86_400_000;

export const feedbackLink = (site: string, code: string, key: string, rating?: number) =>
  `${site}/feedback/${code}?k=${key}${rating ? `&r=${rating}` : ""}`;

const lastDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";

type InviteOrder = { code: string; access_key: string; customer_name: string; email: string };

async function inviteMail(o: InviteOrder, site: string) {
  const [fbk, rr] = await Promise.all([rewardIsOn(FEEDBACK_REWARD.code), rewardIsOn(REVIEW_REWARD.code)]);
  const link = feedbackLink(site, o.code, o.access_key);
  const stars = [1, 2, 3, 4, 5]
    .map((n) => `<a href="${esc(feedbackLink(site, o.code, o.access_key, n))}" title="${n} star${n > 1 ? "s" : ""}" style="color:${STAR};text-decoration:none;font-size:34px;line-height:1;padding:0 2px">★</a>`)
    .join("");
  const rewards = [
    fbk && `the code <b>${FEEDBACK_REWARD.code}</b> for ${FEEDBACK_REWARD.percent}% off your next order`,
    rr && `review the pieces you bought and get <b>${REVIEW_REWARD.code}</b>, another ${REVIEW_REWARD.percent}% off`,
  ].filter(Boolean);
  const subject = `How was your ${STORE.name} order ${o.code}?`;
  const html = layout(
    `How was your order, ${esc(firstName(o.customer_name))}?`,
    `<p style="margin:0 0 8px;font-size:15px;line-height:1.5">We hope order <b>${esc(o.code)}</b> reached you safely and your little one is loving it.</p>
<p style="margin:0 0 12px;font-size:15px;line-height:1.5">Could you spare a minute to tell us how we did? Tap a star to start:</p>
<p style="margin:0">${stars}</p>
${button(link, "Give feedback")}
${rewards.length ? `<p style="margin:18px 0 0;font-size:14px;line-height:1.5">As a thank-you you'll get ${rewards.join(", and you can also ")}. One code per order.</p>` : ""}
<p style="margin:18px 0 0;font-size:13px;line-height:1.5;color:${SOFT}">Something not right with your order? Message us on WhatsApp at ${whatsappDisplay} and we'll sort it out.</p>`,
  );
  const text = [
    `Hi ${firstName(o.customer_name)},`,
    "",
    `We hope order ${o.code} reached you safely and your little one is loving it. Could you spare a minute to tell us how we did?`,
    "",
    `Give feedback: ${link}`,
    "",
    ...(fbk ? [`As a thank-you you'll get ${FEEDBACK_REWARD.code}: ${FEEDBACK_REWARD.percent}% off your next order.`] : []),
    ...(rr ? [`Review the pieces you bought and get ${REVIEW_REWARD.code}: ${REVIEW_REWARD.percent}% off. One code per order.`] : []),
    "",
    `Something not right? WhatsApp us at ${whatsappDisplay}.`,
  ].join("\n");
  return { to: [o.email], subject, html, text };
}

async function logEvent(orderId: number, kind: string, note: string | null, actor: string) {
  const db = await getDb();
  await db.query("INSERT INTO order_events (order_id, kind, note, actor) VALUES ($1, $2, $3, $4)", [orderId, kind, note, actor]);
}

export type InviteResult = "sent" | "no_email" | "not_delivered" | "rated" | "failed" | "not_found";

/** Emails the feedback link for one order now: the admin's "Email it now". */
export async function sendFeedbackInvite(code: string, site: string, actor: string): Promise<InviteResult> {
  const db = await getDb();
  const { rows } = await db.query<InviteOrder & { id: number; status: string; rated: boolean }>(
    `SELECT o.id, o.code, o.access_key, o.customer_name, o.email, o.status,
       EXISTS (SELECT 1 FROM feedback f WHERE f.order_id = o.id) AS rated
     FROM orders o WHERE o.code = $1`,
    [code],
  );
  const o = rows[0];
  if (!o) return "not_found";
  if (o.status !== "delivered") return "not_delivered";
  if (o.rated) return "rated";
  if (!o.email?.trim()) return "no_email";
  if (!(await sendMail(await inviteMail(o, site)))) return "failed";
  await db.query("UPDATE orders SET feedback_mail_at = now() WHERE id = $1", [o.id]);
  await logEvent(o.id, "feedback_mail", `To ${o.email}`, actor);
  return "sent";
}

/** The hour in India now, 0–23. */
const indiaHour = (now: Date) =>
  Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "numeric", hourCycle: "h23" }).format(now));

/**
 * Sends every invite that is due: delivered at least FEEDBACK_MAIL_AFTER_DAYS
 * ago (FEEDBACK_MAIL_DELAY_HOURS overrides it, for testing), not yet emailed
 * or rated, with an email address. Only between 9 am and 8 pm India time, so
 * nobody is woken by it. Orders delivered more than two weeks ago are left
 * alone, so switching this on never mails old customers.
 */
export async function sendDueFeedbackMails(now = new Date()) {
  const site = configuredSiteUrl();
  if (!site || !mailConfigured()) return 0;
  const hour = indiaHour(now);
  if (hour < 9 || hour >= 20) return 0;
  const delayHours = Math.max(0, Math.round(Number(process.env.FEEDBACK_MAIL_DELAY_HOURS ?? FEEDBACK_MAIL_AFTER_DAYS * 24)));

  const db = await getDb();
  // Claimed in the UPDATE itself, so two servers can't both send one.
  const { rows } = await db.query<InviteOrder & { id: number }>(
    `UPDATE orders SET feedback_mail_at = now()
     WHERE feedback_mail_at IS NULL AND id IN (
       SELECT o.id FROM orders o
       WHERE o.status = 'delivered' AND o.feedback_mail_at IS NULL
         AND o.email IS NOT NULL AND btrim(o.email) <> ''
         AND o.delivered_at <= now() - make_interval(hours => $1::int)
         AND o.delivered_at > now() - interval '14 days'
         AND NOT EXISTS (SELECT 1 FROM feedback f WHERE f.order_id = o.id)
       ORDER BY o.delivered_at LIMIT 20)
     RETURNING id, code, access_key, customer_name, email`,
    [delayHours],
  );
  let sent = 0;
  for (const o of rows) {
    if (await sendMail(await inviteMail(o, site))) {
      sent++;
      await logEvent(o.id, "feedback_mail", `To ${o.email}`, "system");
    } else {
      // Try again next round (still only within the two weeks).
      await db.query("UPDATE orders SET feedback_mail_at = NULL WHERE id = $1", [o.id]);
    }
  }
  if (rows.length) console.info(`feedback emails: ${sent} of ${rows.length} sent`);
  return sent;
}

const globalForMailer = globalThis as unknown as { __vevibaFeedbackMailer?: boolean };

/** Checks for due invites a minute after the server starts, then every 15 minutes. */
export function startFeedbackMailer() {
  if (globalForMailer.__vevibaFeedbackMailer) return;
  globalForMailer.__vevibaFeedbackMailer = true;
  const run = () => sendDueFeedbackMails().catch((err) => console.error("feedback emails failed", err));
  setTimeout(run, Number(process.env.FEEDBACK_MAIL_FIRST_RUN_MS ?? 60_000)).unref?.();
  setInterval(run, 15 * 60_000).unref?.();
}

/** The thank-you with the code, after feedback (FBK5) or a review (RR5). */
export async function sendRewardMail(
  o: { customerName: string; email: string | null; phone: string },
  reward: typeof FEEDBACK_REWARD | typeof REVIEW_REWARD,
  site: string,
) {
  if (!o.email?.trim() || !(await rewardIsOn(reward.code))) return false;
  const forFeedback = reward.code === FEEDBACK_REWARD.code;
  const until = lastDay(new Date(Date.now() + reward.days * DAY).toISOString());
  const html = layout(
    forFeedback ? "Thank you for your feedback!" : "Thank you for your review!",
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.5">Hi ${esc(firstName(o.customerName))}, ${forFeedback ? "it really helps us make better little clothes" : "it helps other parents choose"}. Here's ${reward.percent}% off your next order:</p>
<p style="margin:0"><span style="display:inline-block;border:2px dashed ${INK};border-radius:12px;padding:10px 18px;font-family:monospace;font-size:24px;font-weight:bold;letter-spacing:4px">${reward.code}</span></p>
<p style="margin:14px 0 0;font-size:14px;line-height:1.5">Enter it at checkout with your mobile number (+91 ${esc(o.phone)}) by <b>${until}</b>. It works once, and checkout takes one code per order.</p>
${button(`${site}/shop`, "Shop now")}`,
  );
  const text = [
    `Hi ${firstName(o.customerName)}, thank you for your ${forFeedback ? "feedback" : "review"}!`,
    "",
    `Here's ${reward.percent}% off your next order: ${reward.code}`,
    `Enter it at checkout with your mobile number (+91 ${o.phone}) by ${until}. It works once; one code per order.`,
    "",
    `Shop: ${site}/shop`,
  ].join("\n");
  return sendMail({ to: [o.email], subject: `Your ${reward.percent}% off code: ${reward.code}`, html, text });
}

/** Tells the shop straight away when someone rates an order 1 or 2 stars, so they can follow up. */
export async function sendLowRatingAlert(o: { code: string; customerName: string; phone: string }, a: FeedbackAnswers, site: string) {
  const label = <T extends { key: string; label: string }>(list: readonly T[], key: string) => list.find((x) => x.key === key)?.label ?? key;
  const rows = [
    ["Overall", `${a.rating} of 5`],
    ...FEEDBACK_ASPECTS.filter((x) => a.ratings[x.key]).map((x) => [x.label, `${a.ratings[x.key]} of 5`]),
    ...(a.improve.length ? [["Improve", a.improve.map((k) => label(IMPROVE_AREAS, k)).join(", ")]] : []),
    ...(a.recommend ? [["Would recommend", label(RECOMMEND_ANSWERS, a.recommend)]] : []),
    ...(a.liked ? [["Liked most", a.liked]] : []),
    ...(a.wish ? [["Wants next", a.wish]] : []),
  ];
  const admin = `${site}/admin/orders/${o.code}`;
  const html = layout(
    `${a.rating}★ feedback on ${esc(o.code)}`,
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.5">${esc(o.customerName)} (+91 ${esc(o.phone)}) wasn't happy. A quick call or WhatsApp now can turn it round.</p>
<table style="width:100%;border-collapse:collapse;font-size:14px">${rows
      .map(([k, v]) => `<tr><td style="padding:5px 12px 5px 0;color:${SOFT};vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:5px 0">${esc(v)}</td></tr>`)
      .join("")}</table>
${button(admin, "Open the order")}`,
  );
  const text = [`${a.rating}★ feedback on ${o.code} from ${o.customerName} (+91 ${o.phone})`, "", ...rows.map(([k, v]) => `${k}: ${v}`), "", admin].join("\n");
  return sendMail({ to: [STORE.email], subject: `Low rating: ${a.rating}★ on ${o.code}`, html, text });
}
