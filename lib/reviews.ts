import { getDb } from "./db";
import { FeedbackError, cantRateYet, orderForLink } from "./feedback";
import { productImages } from "./images";
import type { OrderItem } from "./types";

// A rating & review of a piece the customer bought, written from the same
// link as the feedback form. One per piece per order. It earns RR5 straight
// away and appears on the product page once the shop approves it.

export type ReviewStatus = "pending" | "approved" | "hidden";
export const BODY_MIN = 10;
export const BODY_MAX = 1000;

export interface Review {
  id: number;
  productId: number;
  rating: number;
  body: string;
  /** How it is signed: first name and initial, e.g. "Meena F." */
  name: string;
  status: ReviewStatus;
  createdAt: string;
}

type ReviewRow = {
  id: number; product_id: number; rating: number; body: string; name: string; status: ReviewStatus; created_at: Date | string;
};

const toReview = (r: ReviewRow): Review => ({
  id: r.id, productId: r.product_id, rating: r.rating, body: r.body, name: r.name, status: r.status,
  createdAt: new Date(r.created_at).toISOString(),
});

/** "Meena Feedback" → "Meena F.": enough to feel real, not enough to find someone. */
export function signature(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "A Veviba parent";
  const first = parts[0][0].toUpperCase() + parts[0].slice(1);
  return parts.length > 1 ? `${first} ${parts[parts.length - 1][0].toUpperCase()}.` : first;
}

export interface ReviewablePiece {
  productId: number;
  name: string;
  slug: string | null;
  image: string | null;
  review: Review | null;
}

/** The distinct pieces in an order, each with the review already written for it, if any. */
export async function piecesToReview(orderId: number, items: OrderItem[]): Promise<ReviewablePiece[]> {
  const db = await getDb();
  const ids = [...new Set(items.map((i) => i.productId))];
  const [products, reviews] = await Promise.all([
    db.query<{ id: number; slug: string; images: string[] | null }>("SELECT id, slug, images FROM products WHERE id = ANY($1)", [ids]),
    db.query<ReviewRow>("SELECT * FROM reviews WHERE order_id = $1", [orderId]),
  ]);
  return ids.map((id) => {
    const p = products.rows.find((r) => r.id === id);
    const r = reviews.rows.find((x) => x.product_id === id);
    return {
      productId: id,
      name: items.find((i) => i.productId === id)!.name,
      slug: p?.slug ?? null,
      image: p ? ((p.images?.length ? p.images : productImages(p.slug))[0] ?? null) : null,
      review: r ? toReview(r) : null,
    };
  });
}

/**
 * Saves a review of one piece in an order. Returns null when the code and key
 * don't match. A second review of the same piece returns the first (created: false).
 */
export async function saveReview(code: string, accessKey: string, productId: number, rating: number, rawBody: string) {
  const order = await orderForLink(code, accessKey);
  if (!order) return null;
  const notYet = cantRateYet(order.status);
  if (notYet) throw new FeedbackError(notYet);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new FeedbackError("Tap the stars to rate this piece.");
  const body = rawBody.trim().replace(/\s+\n/g, "\n").slice(0, BODY_MAX);
  if (body.length < BODY_MIN) throw new FeedbackError("Please write a few words about it.");

  const db = await getDb();
  const { rows: inOrder } = await db.query<{ items: OrderItem[] | string }>("SELECT items FROM orders WHERE id = $1", [order.id]);
  const items: OrderItem[] = typeof inOrder[0].items === "string" ? JSON.parse(inOrder[0].items) : inOrder[0].items;
  if (!items.some((i) => i.productId === productId)) throw new FeedbackError("That piece isn't in this order.");

  const { rows: before } = await db.query("SELECT 1 FROM reviews WHERE order_id = $1 LIMIT 1", [order.id]);
  const { rows } = await db.query<ReviewRow>(
    `INSERT INTO reviews (order_id, product_id, phone, name, rating, body) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (order_id, product_id) DO NOTHING RETURNING *`,
    [order.id, productId, order.phone, signature(order.customerName), rating, body],
  );
  if (!rows[0]) {
    const { rows: existing } = await db.query<ReviewRow>("SELECT * FROM reviews WHERE order_id = $1 AND product_id = $2", [order.id, productId]);
    return { order, review: toReview(existing[0]), created: false, firstForOrder: false };
  }
  const name = items.find((i) => i.productId === productId)!.name;
  await db.query("INSERT INTO order_events (order_id, kind, note, actor) VALUES ($1, 'review', $2, 'customer')", [
    order.id,
    `${name}: ${"★".repeat(rating)}${"☆".repeat(5 - rating)}`,
  ]);
  return { order, review: toReview(rows[0]), created: true, firstForOrder: before.length === 0 };
}

/** Approved reviews of a piece, newest first, with their average. */
export async function productReviews(productId: number) {
  const db = await getDb();
  const { rows } = await db.query<ReviewRow>(
    "SELECT * FROM reviews WHERE product_id = $1 AND status = 'approved' ORDER BY created_at DESC LIMIT 50",
    [productId],
  );
  const reviews = rows.map(toReview);
  const { rows: agg } = await db.query<{ n: number; avg: string | number | null }>(
    "SELECT count(*)::int AS n, avg(rating) AS avg FROM reviews WHERE product_id = $1 AND status = 'approved'",
    [productId],
  );
  return { reviews, count: agg[0]?.n ?? 0, average: agg[0]?.avg != null ? Number(agg[0].avg) : 0 };
}

// ── Admin ──────────────────────────────────────────────────────────────────

export interface AdminReview extends Review {
  orderCode: string;
  productName: string;
  productSlug: string | null;
  customerName: string;
}

export async function listReviews(status: ReviewStatus): Promise<AdminReview[]> {
  const db = await getDb();
  const { rows } = await db.query<ReviewRow & { code: string; customer_name: string; slug: string | null; product_name: string | null }>(
    `SELECT r.*, o.code, o.customer_name, p.slug, p.name AS product_name
     FROM reviews r JOIN orders o ON o.id = r.order_id LEFT JOIN products p ON p.id = r.product_id
     WHERE r.status = $1 ORDER BY r.created_at ${status === "pending" ? "ASC" : "DESC"} LIMIT 200`,
    [status],
  );
  return rows.map((r) => ({
    ...toReview(r), orderCode: r.code, customerName: r.customer_name, productSlug: r.slug, productName: r.product_name ?? "A removed product",
  }));
}

export async function reviewCounts() {
  const db = await getDb();
  const { rows } = await db.query<{ status: ReviewStatus; n: number }>("SELECT status, count(*)::int AS n FROM reviews GROUP BY status");
  const out: Record<ReviewStatus, number> = { pending: 0, approved: 0, hidden: 0 };
  for (const r of rows) out[r.status] = r.n;
  return out;
}

export async function setReviewStatus(id: number, status: ReviewStatus) {
  if (!["pending", "approved", "hidden"].includes(status)) throw new FeedbackError("Pick approve or hide.");
  const db = await getDb();
  const { rows } = await db.query("UPDATE reviews SET status = $2, checked_at = now() WHERE id = $1 RETURNING id", [id, status]);
  if (!rows.length) throw new FeedbackError("That review no longer exists.");
}

/** Average stars and count per product, from approved reviews, for the admin dashboard. */
export async function reviewsByProduct() {
  const db = await getDb();
  const { rows } = await db.query<{ product_id: number; name: string | null; n: number; avg: string | number }>(
    `SELECT r.product_id, p.name, count(*)::int AS n, avg(r.rating) AS avg
     FROM reviews r LEFT JOIN products p ON p.id = r.product_id
     WHERE r.status <> 'hidden' GROUP BY r.product_id, p.name ORDER BY n DESC`,
  );
  return rows.map((r) => ({ productId: r.product_id, name: r.name ?? "A removed product", count: r.n, average: Number(r.avg) }));
}
