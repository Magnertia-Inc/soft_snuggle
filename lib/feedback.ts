import { getDb } from "./db";
import { FEEDBACK_STATUSES, type FeedbackStatus } from "./feedback-statuses";
import { FEEDBACK_ASPECTS, FEEDBACK_REWARD, IMPROVE_AREAS, RECOMMEND_ANSWERS, REVIEW_REWARD } from "./store";

// The feedback form a customer fills in after their order has arrived. The
// link comes by email a couple of days after "Mark delivered"
// (lib/feedback-mail.ts), or from the shop on WhatsApp. One per order.
// Sending it unlocks FBK5 for the order's mobile number; checkCoupon enforces that.

export type AspectKey = (typeof FEEDBACK_ASPECTS)[number]["key"];
export type ImproveKey = (typeof IMPROVE_AREAS)[number]["key"];
export type RecommendKey = (typeof RECOMMEND_ANSWERS)[number]["key"];
export { FEEDBACK_STATUSES, type FeedbackStatus } from "./feedback-statuses";

/** What the customer fills in. Only the overall rating is required. */
export interface FeedbackAnswers {
  rating: number;
  ratings: Partial<Record<AspectKey, number>>;
  improve: ImproveKey[];
  liked: string | null;
  wish: string | null;
  recommend: RecommendKey | null;
  testimonialOk: boolean;
}

export interface Feedback extends FeedbackAnswers {
  /** From the first, shorter form; null on everything since */
  comment: string | null;
  createdAt: string;
  /** The last moment FBK5 works for this order's number, counting from this feedback */
  rewardUntil: string;
}

/** The shopper-facing reason feedback can't be saved. */
export class FeedbackError extends Error {}

export const TEXT_MAX = 1000;
const DAY = 86_400_000;
const ASPECT_KEYS = new Set<string>(FEEDBACK_ASPECTS.map((a) => a.key));
const IMPROVE_KEYS = new Set<string>(IMPROVE_AREAS.map((a) => a.key));
const RECOMMEND_KEYS = new Set<string>(RECOMMEND_ANSWERS.map((a) => a.key));

type FeedbackRow = {
  rating: number; ratings: Record<string, number> | string | null; improve: string[] | null; liked: string | null;
  wish: string | null; recommend: string | null; testimonial_ok: boolean; comment: string | null; created_at: Date | string;
};

const toFeedback = (r: FeedbackRow): Feedback => {
  const at = new Date(r.created_at);
  return {
    rating: r.rating,
    ratings: (typeof r.ratings === "string" ? JSON.parse(r.ratings) : r.ratings) ?? {},
    improve: (r.improve ?? []) as ImproveKey[],
    liked: r.liked,
    wish: r.wish,
    recommend: r.recommend as RecommendKey | null,
    testimonialOk: r.testimonial_ok,
    comment: r.comment,
    createdAt: at.toISOString(),
    rewardUntil: new Date(at.getTime() + FEEDBACK_REWARD.days * DAY).toISOString(),
  };
};

const COLUMNS = "f.rating, f.ratings, f.improve, f.liked, f.wish, f.recommend, f.testimonial_ok, f.comment, f.created_at";

/** The feedback left on an order, for its own pages (which know the order's key). */
export async function getFeedback(code: string, accessKey: string): Promise<Feedback | null> {
  const db = await getDb();
  const { rows } = await db.query<FeedbackRow>(
    `SELECT ${COLUMNS} FROM feedback f JOIN orders o ON o.id = f.order_id WHERE o.code = $1 AND o.access_key = $2`,
    [code, accessKey],
  );
  return rows[0] ? toFeedback(rows[0]) : null;
}

const cleanText = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, TEXT_MAX) || null : null);
const isRating = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 5;

/** Checks and tidies what the browser sent. Throws FeedbackError with a message to show. */
export function readAnswers(body: Record<string, unknown>): FeedbackAnswers {
  const rating = Number(body.rating);
  if (!isRating(rating)) throw new FeedbackError("Please give your overall rating (tap the stars).");
  const ratings: FeedbackAnswers["ratings"] = {};
  if (body.ratings && typeof body.ratings === "object") {
    for (const [k, v] of Object.entries(body.ratings as Record<string, unknown>)) {
      const n = Number(v);
      if (ASPECT_KEYS.has(k) && isRating(n)) ratings[k as AspectKey] = n;
    }
  }
  const improve = Array.isArray(body.improve)
    ? [...new Set(body.improve.filter((k): k is ImproveKey => typeof k === "string" && IMPROVE_KEYS.has(k)))]
    : [];
  const recommend = typeof body.recommend === "string" && RECOMMEND_KEYS.has(body.recommend) ? (body.recommend as RecommendKey) : null;
  return {
    rating, ratings, improve, recommend,
    liked: cleanText(body.liked),
    wish: cleanText(body.wish),
    testimonialOk: body.testimonialOk === true,
  };
}

export interface FeedbackOrder {
  id: number; code: string; accessKey: string; customerName: string; phone: string; email: string | null; status: string;
}

/** The order a feedback or review link points at, when its code and key match. */
export async function orderForLink(code: string, accessKey: string): Promise<FeedbackOrder | null> {
  const db = await getDb();
  const { rows } = await db.query<{
    id: number; code: string; access_key: string; customer_name: string; phone: string; email: string | null; status: string;
  }>(
    "SELECT id, code, access_key, customer_name, right(phone, 10) AS phone, email, status FROM orders WHERE code = $1 AND access_key = $2",
    [code, accessKey],
  );
  const r = rows[0];
  return r ? { id: r.id, code: r.code, accessKey: r.access_key, customerName: r.customer_name, phone: r.phone, email: r.email, status: r.status } : null;
}

/** Why an order can't be rated yet, or null when it can. */
export function cantRateYet(status: string) {
  if (status === "cancelled") return "This order was cancelled, so there's nothing to rate.";
  if (status !== "delivered") return "You can rate this order once it has reached you.";
  return null;
}

/**
 * Saves the feedback for an order. Returns null when the code and key don't
 * match an order. Sending it again returns the first one unchanged (created:
 * false), so a double tap can't rewrite it or restart the 30 days.
 */
export async function saveFeedback(code: string, accessKey: string, a: FeedbackAnswers) {
  const order = await orderForLink(code, accessKey);
  if (!order) return null;
  const notYet = cantRateYet(order.status);
  if (notYet) throw new FeedbackError(notYet);

  const db = await getDb();
  const { rows } = await db.query<FeedbackRow>(
    `INSERT INTO feedback AS f (order_id, phone, rating, ratings, improve, liked, wish, recommend, testimonial_ok)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (order_id) DO NOTHING RETURNING ${COLUMNS}`,
    [order.id, order.phone, a.rating, JSON.stringify(a.ratings), a.improve, a.liked, a.wish, a.recommend, a.testimonialOk],
  );
  if (!rows[0]) return { order, feedback: (await getFeedback(code, accessKey))!, created: false };

  const stars = `${"★".repeat(a.rating)}${"☆".repeat(5 - a.rating)}`;
  await db.query("INSERT INTO order_events (order_id, kind, note, actor) VALUES ($1, 'feedback', $2, 'customer')", [
    order.id,
    `${stars}${a.liked ? ` · ${a.liked}` : ""}`,
  ]);
  return { order, feedback: toFeedback(rows[0]), created: true };
}

/**
 * When a thank-you code stops working for this number: `days` after the
 * latest feedback (FBK5) or review (RR5) it left. Null if it never left any.
 */
export async function rewardEndsFor(phone: string, earnedBy: "feedback" | "review"): Promise<Date | null> {
  const db = await getDb();
  const table = earnedBy === "feedback" ? "feedback" : "reviews";
  const days = earnedBy === "feedback" ? FEEDBACK_REWARD.days : REVIEW_REWARD.days;
  const { rows } = await db.query<{ latest: Date | string | null }>(
    `SELECT max(created_at) AS latest FROM ${table} WHERE phone = $1`,
    [phone.slice(-10)],
  );
  const latest = rows[0]?.latest;
  return latest ? new Date(new Date(latest).getTime() + days * DAY) : null;
}

/** Whether the owner has left a thank-you code switched on, so pages and emails only promise it while it works. */
export async function rewardIsOn(code: string = FEEDBACK_REWARD.code) {
  const db = await getDb();
  const { rows } = await db.query<{ active: boolean }>("SELECT active FROM coupons WHERE code = $1", [code]);
  return rows[0]?.active ?? false;
}

// ── Admin ──────────────────────────────────────────────────────────────────

export interface FeedbackEntry extends Feedback {
  orderCode: string;
  customerName: string;
  phone: string;
  items: { productId: number; name: string }[];
  status: FeedbackStatus;
  adminNote: string | null;
  /** The order this number used FBK5 on, if it has */
  rewardUsedOn: string | null;
}

export async function listFeedback(): Promise<FeedbackEntry[]> {
  const db = await getDb();
  const { rows } = await db.query<FeedbackRow & {
    code: string; customer_name: string; phone: string; items: { productId: number; name: string }[] | string;
    status: string; admin_note: string | null; used_on: string | null;
  }>(
    `SELECT ${COLUMNS}, o.code, o.customer_name, f.phone, o.items, f.status, f.admin_note,
       (SELECT u.code FROM orders u
         WHERE u.coupon_code = $1 AND right(u.phone, 10) = f.phone AND u.status <> 'cancelled'
         ORDER BY u.id LIMIT 1) AS used_on
     FROM feedback f JOIN orders o ON o.id = f.order_id
     ORDER BY f.created_at DESC`,
    [FEEDBACK_REWARD.code],
  );
  return rows.map((r) => {
    const items = typeof r.items === "string" ? JSON.parse(r.items) : r.items;
    return {
      ...toFeedback(r),
      orderCode: r.code, customerName: r.customer_name, phone: r.phone,
      items: items.map((i: { productId: number; name: string }) => ({ productId: i.productId, name: i.name })),
      status: (FEEDBACK_STATUSES.some((s) => s.key === r.status) ? r.status : "new") as FeedbackStatus,
      adminNote: r.admin_note, rewardUsedOn: r.used_on,
    };
  });
}

/** The shop's follow-up on one piece of feedback. */
export async function setFeedbackFollowUp(orderCode: string, status: FeedbackStatus, note: string | null) {
  if (!FEEDBACK_STATUSES.some((s) => s.key === status)) throw new FeedbackError("Pick a status.");
  const db = await getDb();
  const { rows } = await db.query(
    `UPDATE feedback f SET status = $2, admin_note = $3 FROM orders o
     WHERE o.id = f.order_id AND o.code = $1 RETURNING f.id`,
    [orderCode, status, note?.trim().slice(0, TEXT_MAX) || null],
  );
  if (!rows.length) throw new FeedbackError("That feedback no longer exists.");
}

/** Customers who came back: numbers with two or more orders that weren't cancelled, out of all who ordered. */
export async function repeatPurchase() {
  const db = await getDb();
  const { rows } = await db.query<{ buyers: number; repeat: number }>(
    `SELECT count(*)::int AS buyers, count(*) FILTER (WHERE n >= 2)::int AS repeat
     FROM (SELECT right(phone, 10) AS phone, count(*) AS n FROM orders WHERE status <> 'cancelled' GROUP BY 1) t`,
  );
  return rows[0] ?? { buyers: 0, repeat: 0 };
}

/** How many feedback emails went out, and how many of those orders were rated. */
export async function feedbackMailStats() {
  const db = await getDb();
  const { rows } = await db.query<{ sent: number; answered: number }>(
    `SELECT count(*)::int AS sent, count(f.id)::int AS answered
     FROM orders o LEFT JOIN feedback f ON f.order_id = o.id WHERE o.feedback_mail_at IS NOT NULL`,
  );
  return rows[0] ?? { sent: 0, answered: 0 };
}

/** How many times each thank-you code has been used on orders that weren't cancelled. */
export async function rewardUses() {
  const db = await getDb();
  const { rows } = await db.query<{ code: string; n: number }>(
    "SELECT coupon_code AS code, count(*)::int AS n FROM orders WHERE coupon_code = ANY($1) AND status <> 'cancelled' GROUP BY 1",
    [[FEEDBACK_REWARD.code, REVIEW_REWARD.code]],
  );
  return Object.fromEntries(rows.map((r) => [r.code, r.n])) as Record<string, number>;
}
