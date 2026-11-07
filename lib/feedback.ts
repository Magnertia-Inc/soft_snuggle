import { getDb } from "./db";
import { FEEDBACK_REWARD } from "./store";

// Feedback customers leave on their order page right after ordering: 1–5
// stars and an optional comment, one per order. Leaving it unlocks the code
// FBK5 (FEEDBACK_REWARD) for the order's mobile number; checkCoupon enforces that.

export interface Feedback {
  rating: number;
  comment: string | null;
  createdAt: string;
  /** The last moment FBK5 works for this order's number, counting from this feedback */
  rewardUntil: string;
}

/** The shopper-facing reason feedback can't be saved. */
export class FeedbackError extends Error {}

export const COMMENT_MAX = 1000;
const DAY = 86_400_000;

type FeedbackRow = { rating: number; comment: string | null; created_at: Date | string };

const toFeedback = (r: FeedbackRow): Feedback => {
  const at = new Date(r.created_at);
  return {
    rating: r.rating,
    comment: r.comment,
    createdAt: at.toISOString(),
    rewardUntil: new Date(at.getTime() + FEEDBACK_REWARD.days * DAY).toISOString(),
  };
};

/** The feedback left on an order, for its own page (which knows the order's key). */
export async function getFeedback(code: string, accessKey: string): Promise<Feedback | null> {
  const db = await getDb();
  const { rows } = await db.query<FeedbackRow>(
    `SELECT f.rating, f.comment, f.created_at FROM feedback f JOIN orders o ON o.id = f.order_id
     WHERE o.code = $1 AND o.access_key = $2`,
    [code, accessKey],
  );
  return rows[0] ? toFeedback(rows[0]) : null;
}

/**
 * Saves feedback for an order. Returns null when the code and key don't
 * match an order. Sending it again returns the first one unchanged, so a
 * double tap can't rewrite it or restart the 30 days.
 */
export async function saveFeedback(code: string, accessKey: string, rating: number, rawComment: string) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new FeedbackError("Tap a star to rate your order.");
  const comment = rawComment.trim().slice(0, COMMENT_MAX) || null;

  const db = await getDb();
  const { rows: orders } = await db.query<{ id: number; phone: string; status: string }>(
    "SELECT id, right(phone, 10) AS phone, status FROM orders WHERE code = $1 AND access_key = $2",
    [code, accessKey],
  );
  const order = orders[0];
  if (!order) return null;
  if (order.status === "cancelled") throw new FeedbackError("This order was cancelled, so there's nothing to rate.");

  const { rows: saved } = await db.query<FeedbackRow>(
    `INSERT INTO feedback (order_id, phone, rating, comment) VALUES ($1, $2, $3, $4)
     ON CONFLICT (order_id) DO NOTHING RETURNING rating, comment, created_at`,
    [order.id, order.phone, rating, comment],
  );
  if (saved[0]) {
    await db.query("INSERT INTO order_events (order_id, kind, note, actor) VALUES ($1, 'feedback', $2, 'customer')", [
      order.id,
      `${"★".repeat(rating)}${"☆".repeat(5 - rating)}${comment ? ` · ${comment}` : ""}`,
    ]);
    return toFeedback(saved[0]);
  }
  return getFeedback(code, accessKey);
}

/** When FBK5 stops working for this number: 30 days after its latest feedback. Null if it never left any. */
export async function rewardEndsFor(phone: string): Promise<Date | null> {
  const db = await getDb();
  const { rows } = await db.query<{ latest: Date | string | null }>(
    "SELECT max(created_at) AS latest FROM feedback WHERE phone = $1",
    [phone.slice(-10)],
  );
  const latest = rows[0]?.latest;
  return latest ? new Date(new Date(latest).getTime() + FEEDBACK_REWARD.days * DAY) : null;
}

/** Whether the owner has left FBK5 switched on, so pages and emails only promise it while it works. */
export async function rewardIsOn() {
  const db = await getDb();
  const { rows } = await db.query<{ active: boolean }>("SELECT active FROM coupons WHERE code = $1", [FEEDBACK_REWARD.code]);
  return rows[0]?.active ?? false;
}

// ── Admin ──────────────────────────────────────────────────────────────────

export interface FeedbackEntry {
  orderCode: string;
  customerName: string;
  phone: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  /** The order this number used FBK5 on, if it has */
  rewardUsedOn: string | null;
}

export async function listFeedback(): Promise<FeedbackEntry[]> {
  const db = await getDb();
  const { rows } = await db.query<{
    code: string; customer_name: string; phone: string; rating: number; comment: string | null;
    created_at: Date | string; used_on: string | null;
  }>(
    `SELECT o.code, o.customer_name, f.phone, f.rating, f.comment, f.created_at,
       (SELECT u.code FROM orders u
         WHERE u.coupon_code = $1 AND right(u.phone, 10) = f.phone AND u.status <> 'cancelled'
         ORDER BY u.id LIMIT 1) AS used_on
     FROM feedback f JOIN orders o ON o.id = f.order_id
     ORDER BY f.created_at DESC`,
    [FEEDBACK_REWARD.code],
  );
  return rows.map((r) => ({
    orderCode: r.code, customerName: r.customer_name, phone: r.phone, rating: r.rating, comment: r.comment,
    createdAt: new Date(r.created_at).toISOString(), rewardUsedOn: r.used_on,
  }));
}
