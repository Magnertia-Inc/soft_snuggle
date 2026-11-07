import { reclaimCoupon, releaseCoupon } from "./coupons";
import { getDb } from "./db";
import { claimGuestOrders, logOrderEvent } from "./queries";
import type { OrderItem, PaymentMethod } from "./types";

// ── Order views ────────────────────────────────────────────────────────────
// The tabs on the orders page, in the order work happens. Each is a fixed SQL
// condition, never built from what the browser sends.

export const ORDER_VIEWS = {
  all: { label: "All", where: "TRUE" },
  new: { label: "New", where: "status = 'new'" },
  to_pack: { label: "To pack", where: "status = 'confirmed'" },
  to_ship: { label: "To ship", where: "status = 'packed'" },
  in_transit: { label: "In transit", where: "status IN ('shipped', 'out_for_delivery')" },
  delivered: { label: "Delivered", where: "status = 'delivered'" },
  cancelled: { label: "Cancelled", where: "status = 'cancelled'" },
} as const;

export type OrderView = keyof typeof ORDER_VIEWS;
export const isOrderView = (v: unknown): v is OrderView => typeof v === "string" && v in ORDER_VIEWS;

export interface AdminOrderRow {
  code: string;
  customerName: string;
  phone: string;
  city: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  status: string;
  itemCount: number;
  placedAt: string;
}

type ListRow = {
  code: string; customer_name: string; phone: string; city: string; total: number;
  payment_method: PaymentMethod; payment_status: string; status: string; items: OrderItem[] | string;
  created_at: Date | string;
};

const parseItems = (items: OrderItem[] | string): OrderItem[] => (typeof items === "string" ? JSON.parse(items) : items);

const toRow = (r: ListRow): AdminOrderRow => ({
  code: r.code,
  customerName: r.customer_name,
  phone: r.phone,
  city: r.city,
  total: Number(r.total),
  paymentMethod: r.payment_method,
  paymentStatus: r.payment_status,
  status: r.status,
  itemCount: parseItems(r.items).reduce((n, i) => n + i.qty, 0),
  placedAt: new Date(r.created_at).toISOString(),
});

export const PAGE_SIZE = 50;

/** Orders for one tab, newest first, optionally narrowed by order ID, phone or name. */
export async function listOrders({ view, q, page }: { view: OrderView; q: string; page: number }) {
  const db = await getDb();
  const params: unknown[] = [];
  let where: string = ORDER_VIEWS[view].where;

  const term = q.trim().slice(0, 60);
  if (term) {
    params.push(`%${term}%`);
    const digits = term.replace(/\D/g, "");
    // "+91 98765 43210" should find 9876543210, so phones are matched on digits.
    params.push(digits.length >= 4 ? `%${digits.slice(-10)}%` : null);
    where += ` AND (code ILIKE $1 OR customer_name ILIKE $1 OR ($2::text IS NOT NULL AND phone LIKE $2))`;
  }

  const [{ rows }, count] = await Promise.all([
    db.query<ListRow>(
      `SELECT code, customer_name, phone, city, total, payment_method, payment_status, status, items, created_at
       FROM orders WHERE ${where} ORDER BY id DESC LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
      params,
    ),
    db.query<{ n: number }>(`SELECT count(*)::int AS n FROM orders WHERE ${where}`, params),
  ]);
  return { orders: rows.map(toRow), total: count.rows[0].n };
}

// ── Dashboard ──────────────────────────────────────────────────────────────

// The shop runs on Indian time, the server on UTC: "today" starts at midnight IST.
const IST_DAY = "(created_at AT TIME ZONE 'Asia/Kolkata')::date";
const IST_TODAY = "(now() AT TIME ZONE 'Asia/Kolkata')::date";

export interface OrderCounts extends Record<OrderView, number> {
  utr_to_check: number;
  cod_to_confirm: number;
  awaiting_payment: number;
}

/** How many orders sit in each tab, plus the kinds of new order that need a look. */
export async function getOrderCounts(): Promise<OrderCounts> {
  const db = await getDb();
  const { rows } = await db.query<OrderCounts>(
    `SELECT
       count(*)::int                                                                 AS "all",
       count(*) FILTER (WHERE status = 'new' AND payment_status = 'submitted')::int AS utr_to_check,
       count(*) FILTER (WHERE status = 'new' AND payment_method = 'cod')::int       AS cod_to_confirm,
       count(*) FILTER (WHERE status = 'new' AND payment_status = 'pending')::int   AS awaiting_payment,
       count(*) FILTER (WHERE ${ORDER_VIEWS.new.where})::int        AS new,
       count(*) FILTER (WHERE ${ORDER_VIEWS.to_pack.where})::int    AS to_pack,
       count(*) FILTER (WHERE ${ORDER_VIEWS.to_ship.where})::int    AS to_ship,
       count(*) FILTER (WHERE ${ORDER_VIEWS.in_transit.where})::int AS in_transit,
       count(*) FILTER (WHERE ${ORDER_VIEWS.delivered.where})::int  AS delivered,
       count(*) FILTER (WHERE ${ORDER_VIEWS.cancelled.where})::int  AS cancelled
     FROM orders`,
  );
  return rows[0];
}

export async function getDashboard() {
  const db = await getDb();
  const [counts, sales, recent] = await Promise.all([
    getOrderCounts(),
    db.query<{ today_orders: number; today_sales: number; week_orders: number; week_sales: number; month_sales: number }>(
      `SELECT
         count(*) FILTER (WHERE ${IST_DAY} = ${IST_TODAY})::int                          AS today_orders,
         coalesce(sum(total) FILTER (WHERE ${IST_DAY} = ${IST_TODAY}), 0)::int          AS today_sales,
         count(*) FILTER (WHERE ${IST_DAY} > ${IST_TODAY} - 7)::int                     AS week_orders,
         coalesce(sum(total) FILTER (WHERE ${IST_DAY} > ${IST_TODAY} - 7), 0)::int     AS week_sales,
         coalesce(sum(total) FILTER (WHERE ${IST_DAY} > ${IST_TODAY} - 30), 0)::int    AS month_sales
       FROM orders WHERE status <> 'cancelled'`,
    ),
    db.query<ListRow>(
      `SELECT code, customer_name, phone, city, total, payment_method, payment_status, status, items, created_at
       FROM orders ORDER BY id DESC LIMIT 8`,
    ),
  ]);
  return { counts, sales: sales.rows[0], recent: recent.rows.map(toRow) };
}

// ── One order ──────────────────────────────────────────────────────────────

export interface OrderEvent {
  kind: string;
  note: string | null;
  actor: string | null;
  at: string;
}

export interface AdminOrder extends AdminOrderRow {
  email: string | null;
  address: string;
  state: string;
  pincode: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shipping: number;
  codFee: number;
  utr: string | null;
  courier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  hasAccount: boolean;
  /** The account that placed it has had its number verified. */
  accountVerified: boolean;
  /** When the admin saw the customer's WhatsApp message for this order. */
  whatsappAt: string | null;
  /** For the customer's own links (order page, feedback page) */
  accessKey: string;
  deliveredAt: string | null;
  /** When the "How was your order?" email went out */
  feedbackMailAt: string | null;
  /** The overall rating from the feedback form, if they've filled it in */
  feedbackRating: number | null;
  events: OrderEvent[];
}

export async function getAdminOrder(code: string): Promise<AdminOrder | null> {
  const db = await getDb();
  const { rows } = await db.query<ListRow & {
    id: number; email: string | null; address: string; state: string; pincode: string; subtotal: number;
    shipping: number; cod_fee: number | null; utr: string | null; courier: string | null; tracking_number: string | null;
    tracking_url: string | null; customer_id: number | null; discount: number | null; coupon_code: string | null;
    whatsapp_at: Date | string | null; account_verified: boolean | null; access_key: string;
    delivered_at: Date | string | null; feedback_mail_at: Date | string | null; feedback_rating: number | null;
  }>(
    `SELECT o.*, c.phone_verified_at IS NOT NULL AS account_verified,
       (SELECT f.rating FROM feedback f WHERE f.order_id = o.id) AS feedback_rating
     FROM orders o LEFT JOIN customers c ON c.id = o.customer_id WHERE o.code = $1`,
    [code],
  );
  const r = rows[0];
  if (!r) return null;

  const events = await db.query<{ kind: string; note: string | null; actor: string | null; created_at: Date | string }>(
    "SELECT kind, note, actor, created_at FROM order_events WHERE order_id = $1 ORDER BY id",
    [r.id],
  );
  return {
    ...toRow(r),
    email: r.email,
    address: r.address,
    state: r.state,
    pincode: r.pincode,
    items: parseItems(r.items),
    subtotal: r.subtotal,
    discount: Number(r.discount ?? 0),
    couponCode: r.coupon_code,
    shipping: r.shipping,
codFee: r.cod_fee ?? 0,
    utr: r.utr,
    courier: r.courier,
    trackingNumber: r.tracking_number,
    trackingUrl: r.tracking_url,
    hasAccount: r.customer_id !== null,
    accountVerified: r.account_verified === true,
    whatsappAt: r.whatsapp_at ? new Date(r.whatsapp_at).toISOString() : null,
    accessKey: r.access_key,
    deliveredAt: r.delivered_at ? new Date(r.delivered_at).toISOString() : null,
    feedbackMailAt: r.feedback_mail_at ? new Date(r.feedback_mail_at).toISOString() : null,
    feedbackRating: r.feedback_rating,
    events: events.rows.map((e) => ({ kind: e.kind, note: e.note, actor: e.actor, at: new Date(e.created_at).toISOString() })),
  };
}

// ── Moving an order along ──────────────────────────────────────────────────

/**
 * Each step the admin can take, the statuses it may be taken from, and what it
 * changes. The status check is part of the UPDATE itself, so two people
 * pressing buttons at once can't push an order through a step twice.
 */
const STEPS = {
  // Confirming a UPI order is the owner saying the money is in the bank.
  // Confirming a cash-on-delivery order is the owner saying the customer's
  // WhatsApp message has arrived, so it is recorded at the same time.
  confirm: {
    from: ["new"], to: "confirmed",
    set: `confirmed_at = now(), payment_status = CASE WHEN payment_method = 'upi' THEN 'paid' ELSE payment_status END,
      whatsapp_at = CASE WHEN payment_method = 'cod' THEN COALESCE(whatsapp_at, now()) ELSE whatsapp_at END`,
  },
  pack: { from: ["confirmed"], to: "packed", set: "" },
  ship: {
    from: ["confirmed", "packed"], to: "shipped",
    set: "shipped_at = now(), courier = $3, tracking_number = $4, tracking_url = $5",
  },
  out_for_delivery: { from: ["shipped"], to: "out_for_delivery", set: "" },
  deliver: { from: ["shipped", "out_for_delivery"], to: "delivered", set: "delivered_at = now()" },
  cancel: { from: ["new", "confirmed", "packed", "shipped", "out_for_delivery"], to: "cancelled", set: "" },
  // For a cancel pressed by mistake.
  reopen: { from: ["cancelled"], to: "new", set: "" },
} as const;

export type OrderAction = keyof typeof STEPS | "tracking" | "note" | "whatsapp";
export const ORDER_ACTIONS = [...Object.keys(STEPS), "tracking", "note", "whatsapp"] as OrderAction[];

export class AdminError extends Error {}

export interface ActionInput {
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  note?: string;
}

export async function updateOrder(code: string, action: OrderAction, input: ActionInput, actor: string) {
  const db = await getDb();
  const courier = input.courier?.trim().slice(0, 60) || null;
  const trackingNumber = input.trackingNumber?.trim().slice(0, 60) || null;
  const trackingUrl = input.trackingUrl?.trim().slice(0, 300) || null;
  const note = input.note?.trim().slice(0, 500) || null;

  if (trackingUrl && !/^https?:\/\//i.test(trackingUrl)) throw new AdminError("The tracking link must start with https://");

  if (action === "note") {
    if (!note) throw new AdminError("Write a note first.");
    const { rows } = await db.query<{ id: number }>("SELECT id FROM orders WHERE code = $1", [code]);
    if (!rows[0]) throw new AdminError("Order not found.");
    await logOrderEvent(rows[0].id, "note", note, actor);
    return;
  }

  if (action === "whatsapp") {
    const { rows } = await db.query<{ id: number }>(
      `UPDATE orders SET whatsapp_at = now(), updated_at = now()
       WHERE code = $1 AND whatsapp_at IS NULL AND status <> 'cancelled' RETURNING id`,
      [code],
    );
    if (!rows[0]) throw new AdminError("This order has moved on since the page loaded. Refresh to see where it is.");
    await logOrderEvent(rows[0].id, "whatsapp", null, actor);
    await verifyFromOrder(rows[0].id);
    return;
  }

  if (action === "tracking") {
    if (!courier || !trackingNumber) throw new AdminError("Enter the courier and the tracking number.");
    const { rows } = await db.query<{ id: number }>(
      `UPDATE orders SET courier = $2, tracking_number = $3, tracking_url = $4, updated_at = now()
       WHERE code = $1 AND status IN ('shipped', 'out_for_delivery') RETURNING id`,
      [code, courier, trackingNumber, trackingUrl],
    );
    if (!rows[0]) throw new AdminError("Tracking can only be changed while the order is on its way.");
    await logOrderEvent(rows[0].id, "tracking", `${courier} · ${trackingNumber}`, actor);
    return;
  }

  const step = STEPS[action];
  if (action === "ship" && (!courier || !trackingNumber)) throw new AdminError("Enter the courier and the tracking number.");
  if (action === "cancel" && !note) throw new AdminError("Say why the order is being cancelled.");

  const params: unknown[] = [code, step.from];
  if (action === "ship") params.push(courier, trackingNumber, trackingUrl);
  const { rows } = await db.query<{ id: number; coupon_code: string | null }>(
    `UPDATE orders SET status = '${step.to}', updated_at = now()${step.set ? `, ${step.set}` : ""}
     WHERE code = $1 AND status = ANY($2::text[]) RETURNING id, coupon_code`,
    params,
  );
  if (!rows[0]) throw new AdminError("This order has moved on since the page loaded. Refresh to see where it is.");

  // A cancelled order gives its use of a discount code back; reopening takes it again.
  const coupon = rows[0].coupon_code;
  if (coupon && action === "cancel") await releaseCoupon(coupon);
  if (coupon && action === "reopen") await reclaimCoupon(coupon);

  const detail = action === "ship" ? `${courier} · ${trackingNumber}` : note;
  await logOrderEvent(rows[0].id, action, detail, actor);
  if (action === "confirm") await verifyFromOrder(rows[0].id);
}

/**
 * Once an order's WhatsApp message has reached the shop, the number on it is
 * real and in the customer's hands. If a signed-in account placed the order
 * with its own number, that account's number is now verified, and guest
 * orders from the same number join it.
 *
 * Only the account that placed this order is touched. Someone who signed up
 * with another person's number can't get verified by that person's orders.
 */
async function verifyFromOrder(orderId: number) {
  const db = await getDb();
  const { rows } = await db.query<{ id: number }>(
    `UPDATE customers c SET phone_verified_at = COALESCE(c.phone_verified_at, now())
     FROM orders o
     WHERE o.id = $1 AND o.whatsapp_at IS NOT NULL AND o.customer_id = c.id AND o.phone = c.phone
     RETURNING c.id`,
    [orderId],
  );
  if (rows[0]) await claimGuestOrders(rows[0].id);
}

// ── Stock ──────────────────────────────────────────────────────────────────

export async function setStock(productId: number, input: { inStock?: boolean; soldOutSizes?: string[] }) {
  const db = await getDb();
  const { rows } = await db.query<{ sizes: string[] }>("SELECT sizes FROM products WHERE id = $1", [productId]);
  if (!rows[0]) throw new AdminError("Product not found.");

  if (input.soldOutSizes) {
    const unknown = input.soldOutSizes.filter((s) => !rows[0].sizes.includes(s));
    if (unknown.length) throw new AdminError(`Unknown size: ${unknown.join(", ")}`);
  }
  await db.query(
    `UPDATE products SET
       in_stock       = COALESCE($2, in_stock),
       sold_out_sizes = COALESCE($3::text[], sold_out_sizes)
     WHERE id = $1`,
    [productId, input.inStock ?? null, input.soldOutSizes ?? null],
  );
}
