import { randomBytes } from "node:crypto";
import { getDb } from "./db";
import { coloursFor } from "./colours";
import { productImages } from "./images";
import { CouponError, checkCoupon, claimCoupon, releaseCoupon } from "./coupons";
import { inr, shippingFor } from "./store";
import { courierLink, type TrackInfo } from "./tracking";
import type { Order, OrderItem, PaymentMethod, Product } from "./types";

export type ProductRow = {
  id: number; slug: string; name: string; category: Product["category"]; fabric: string;
  colour: string; price: number; compare_at: number | null; badge: string | null;
  organic: boolean; sizes: string[]; age_groups: string[]; description: string; care: string;
  tint: string; garment: string; in_stock: boolean; sold_out_sizes: string[] | null;
  hidden: boolean; deleted_at: Date | string | null; images: string[] | null;
};

/** What shoppers may see: not hidden by the owner and not deleted. */
const LISTED = "NOT hidden AND deleted_at IS NULL";

export function toProduct(r: ProductRow): Product {
  // The owner's own photo list once they have edited the photos in the admin
  // panel (an empty list there means "no photos"), the public/ folder until then.
  const images = r.images ?? productImages(r.slug);
  return {
    id: r.id, slug: r.slug, name: r.name, category: r.category, fabric: r.fabric,
    colour: r.colour, price: r.price, compareAt: r.compare_at, badge: r.badge,
    organic: r.organic, sizes: r.sizes, ageGroups: r.age_groups, description: r.description,
    care: r.care, tint: r.tint, garment: r.garment, inStock: r.in_stock,
    soldOutSizes: r.sold_out_sizes ?? [],
    images,
    hidden: r.hidden ?? false,
    colours: coloursFor({ slug: r.slug, colour: r.colour, garment: r.garment, category: r.category }),
  };
}

export async function getProducts(): Promise<Product[]> {
  const db = await getDb();
  const { rows } = await db.query<ProductRow>(`SELECT * FROM products WHERE ${LISTED} ORDER BY sort, id`);
  return rows.map(toProduct);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const db = await getDb();
  const { rows } = await db.query<ProductRow>(`SELECT * FROM products WHERE slug = $1 AND ${LISTED}`, [slug]);
  return rows[0] ? toProduct(rows[0]) : null;
}

export interface NewOrderInput {
  customerId?: number | null;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: PaymentMethod;
  items: { productId: number; size: string; colour?: string; qty: number }[];
  couponCode?: string | null;
}

export class OrderError extends Error {}

/** Prices always come from the database, never from the browser. */
export async function createOrder(input: NewOrderInput) {
  const db = await getDb();
  const ids = [...new Set(input.items.map((i) => i.productId))];
  const { rows } = await db.query<ProductRow>("SELECT * FROM products WHERE id = ANY($1::int[])", [ids]);
  const byId = new Map(rows.map((r) => [r.id, r]));

  const items: OrderItem[] = input.items.map((i) => {
    const p = byId.get(i.productId);
    if (!p || !p.in_stock || p.hidden || p.deleted_at) {
      throw new OrderError("One of the items in your bag is no longer available.");
    }
    if (!p.sizes.includes(i.size)) throw new OrderError(`Size ${i.size} is not available for ${p.name}.`);
    if (p.sold_out_sizes?.includes(i.size)) {
      throw new OrderError(`Size ${i.size} of ${p.name} has just sold out. Please remove it from your bag.`);
    }
    const options = coloursFor({ slug: p.slug, colour: p.colour, garment: p.garment, category: p.category });
    const colour = i.colour ? options.find((c) => c.name === i.colour)?.name : undefined;
    if (i.colour && !colour) throw new OrderError(`Colour ${i.colour} is not available for ${p.name}.`);
    return { productId: p.id, name: p.name, size: i.size, ...(colour ? { colour } : {}), qty: i.qty, price: p.price };
  });

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = shippingFor(subtotal);

  // The code is checked again here, against the real prices, whatever the
  // checkout page showed: it may have expired or run out since.
  let discount = 0;
  let couponCode: string | null = null;
  if (input.couponCode) {
    try {
      const checked = await checkCoupon(input.couponCode, subtotal, input.phone);
      if (!(await claimCoupon(checked.coupon.id))) throw new CouponError("That code has just been fully used.");
      discount = checked.discount;
      couponCode = checked.coupon.code;
    } catch (err) {
      if (err instanceof CouponError) throw new OrderError(`${err.message} Remove the code to order without it.`);
      throw err;
    }
  }

  const total = subtotal - discount + shipping;
  const accessKey = randomBytes(12).toString("hex");

  let res;
  try {
    res = await db.query<{ id: number; code: string }>(
      `INSERT INTO orders
        (access_key, customer_name, phone, email, address, city, state, pincode,
         items, subtotal, shipping, total, payment_method, payment_status, customer_id,
         coupon_code, discount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id, code`,
      [
        accessKey, input.customerName, input.phone, input.email, input.address, input.city,
        input.state, input.pincode, JSON.stringify(items), subtotal, shipping, total,
        input.paymentMethod, input.paymentMethod === "cod" ? "cod" : "pending",
        input.customerId ?? null, couponCode, discount,
      ],
    );
  } catch (err) {
    // The order never existed, so neither did its use of the code.
    if (couponCode) await releaseCoupon(couponCode).catch(() => {});
    throw err;
  }
  const how = input.paymentMethod === "cod" ? "Cash on delivery" : "UPI";
  await logOrderEvent(res.rows[0].id, "placed", couponCode ? `${how} · ${couponCode} −${inr(discount)}` : how, "customer");
  return { code: res.rows[0].code, accessKey, total };
}

/** One line of an order's history, shown on the admin order page. */
export async function logOrderEvent(orderId: number, kind: string, note: string | null, actor: string) {
  const db = await getDb();
  await db.query("INSERT INTO order_events (order_id, kind, note, actor) VALUES ($1, $2, $3, $4)", [
    orderId, kind, note, actor,
  ]);
}

type OrderRow = {
  code: string; access_key: string; customer_name: string; phone: string; email: string | null;
  address: string; city: string; state: string; pincode: string; items: OrderItem[];
  subtotal: number; shipping: number; total: number; payment_method: PaymentMethod;
  payment_status: string; utr: string | null; created_at: Date | string;
  discount: number | null; coupon_code: string | null; status: string;
};

export async function getOrder(code: string, accessKey: string): Promise<Order | null> {
  const db = await getDb();
  const { rows } = await db.query<OrderRow>(
    "SELECT * FROM orders WHERE code = $1 AND access_key = $2",
    [code, accessKey],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    code: r.code, accessKey: r.access_key, customerName: r.customer_name, phone: r.phone,
    email: r.email, address: r.address, city: r.city, state: r.state, pincode: r.pincode,
    items: typeof r.items === "string" ? JSON.parse(r.items) : r.items,
    subtotal: r.subtotal, discount: r.discount ?? 0, couponCode: r.coupon_code,
    shipping: r.shipping, total: r.total,
    paymentMethod: r.payment_method, paymentStatus: r.payment_status, utr: r.utr,
    status: r.status, createdAt: new Date(r.created_at).toISOString(),
  };
}

/**
 * Saves the customer's UPI reference. Returns null when the order can't take
 * one, otherwise the reference it replaced (null the first time).
 */
export async function submitUtr(code: string, accessKey: string, utr: string) {
  const db = await getDb();
  // Only while the payment is still unchecked: once the owner has marked it
  // paid, sending a UTR again would quietly put it back to "submitted". Nor
  // on a cancelled order, which nobody should be paying for.
  const { rows } = await db.query<{ id: number; previous: string | null }>(
    `UPDATE orders o SET utr = $3, payment_status = 'submitted', updated_at = now()
     FROM (SELECT id, utr AS previous FROM orders WHERE code = $1) prev
     WHERE o.id = prev.id AND o.access_key = $2 AND o.payment_method = 'upi'
       AND o.payment_status IN ('pending', 'submitted') AND o.status <> 'cancelled'
     RETURNING o.id, prev.previous`,
    [code, accessKey, utr],
  );
  if (!rows[0]) return null;
  await logOrderEvent(rows[0].id, "utr_submitted", utr, "customer");
  return { previousUtr: rows[0].previous };
}

export async function addSubscriber(email: string) {
  const db = await getDb();
  await db.query("INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING", [email]);
}

type TrackRow = {
  code: string; phone: string; status: string; payment_method: "upi" | "cod"; payment_status: string;
  total: number; items: OrderItem[] | string; city: string; pincode: string; created_at: Date | string;
  updated_at: Date | string; confirmed_at: Date | string | null; shipped_at: Date | string | null;
  delivered_at: Date | string | null; courier: string | null; tracking_number: string | null;
  tracking_url: string | null;
};

const iso = (d: Date | string | null) => (d ? new Date(d).toISOString() : null);

/** Order status for the public tracking page. The phone number must match the order. */
export async function trackOrder(code: string, phone: string): Promise<TrackInfo | null> {
  const db = await getDb();
  const { rows } = await db.query<TrackRow>("SELECT * FROM orders WHERE code = $1", [code]);
  const r = rows[0];
  if (!r || r.phone.slice(-10) !== phone.slice(-10)) return null;
  return toTrackInfo(r);
}

/**
 * The same status for someone signed in, without asking for the phone number
 * they already proved when they logged in. Only their own orders match.
 */
export async function trackOwnOrder(code: string, customerId: number): Promise<TrackInfo | null> {
  const db = await getDb();
  const { rows } = await db.query<TrackRow>(
    "SELECT * FROM orders WHERE code = $1 AND customer_id = $2",
    [code, customerId],
  );
  return rows[0] ? toTrackInfo(rows[0]) : null;
}

function toTrackInfo(r: TrackRow): TrackInfo {
  const items: OrderItem[] = typeof r.items === "string" ? JSON.parse(r.items) : r.items;
  return {
    code: r.code,
    status: r.status as TrackInfo["status"],
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    total: r.total,
    items: items.map((i) => ({ name: i.name, size: i.size, colour: i.colour, qty: i.qty })),
    city: r.city,
    pincode: r.pincode,
    placedAt: iso(r.created_at)!,
    confirmedAt: iso(r.confirmed_at),
    shippedAt: iso(r.shipped_at),
    deliveredAt: iso(r.delivered_at),
    updatedAt: iso(r.updated_at)!,
    courier: r.courier,
    trackingNumber: r.tracking_number,
    trackingUrl: courierLink(r.courier, r.tracking_number, r.tracking_url),
  };
}

// ── Accounts ───────────────────────────────────────────────────────────────

export interface Customer {
  id: number;
  phone: string;
  name: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  /** Signs in with Google (may also have a password). */
  google: boolean;
  /** Has a password, so can also log in with mobile number + password. */
  hasPassword: boolean;
  /** An order from this account was confirmed after its WhatsApp came from this number. */
  phoneVerified: boolean;
}

type CustomerRow = Omit<Customer, "google" | "hasPassword" | "phoneVerified"> & {
  password_hash: string | null;
  google_sub: string | null;
  phone_verified_at: string | null;
};

const toCustomer = (r: CustomerRow): Customer => ({
  id: r.id, phone: r.phone, name: r.name, email: r.email,
  address: r.address, city: r.city, state: r.state, pincode: r.pincode,
  google: r.google_sub !== null, hasPassword: !!r.password_hash, phoneVerified: r.phone_verified_at !== null,
});

export class AuthError extends Error {}

const NUMBER_TAKEN = "An account already uses this number. Try logging in.";

/**
 * Creates the account. Guest orders from the same number are not added yet:
 * anyone can type a number, so they wait until the number is verified.
 */
export async function createCustomer(input: {
  phone: string; name: string; email: string | null; passwordHash: string | null; googleSub?: string;
}): Promise<Customer> {
  const db = await getDb();
  const existing = await db.query("SELECT id FROM customers WHERE phone = $1", [input.phone]);
  if (existing.rows.length) throw new AuthError(NUMBER_TAKEN);

  try {
    const { rows } = await db.query<CustomerRow>(
      `INSERT INTO customers (phone, name, email, password_hash, google_sub, last_login_at)
       VALUES ($1, $2, $3, $4, $5, now()) RETURNING *`,
      [input.phone, input.name, input.email, input.passwordHash, input.googleSub ?? null],
    );
    return toCustomer(rows[0]);
  } catch (err) {
    // Two sign-ups racing for the same number get past the check above together.
    if ((err as { code?: string }).code === "23505") throw new AuthError(NUMBER_TAKEN);
    throw err;
  }
}

export async function findCustomerByGoogle(sub: string): Promise<Customer | null> {
  const db = await getDb();
  const { rows } = await db.query<CustomerRow>("SELECT * FROM customers WHERE google_sub = $1", [sub]);
  return rows[0] ? toCustomer(rows[0]) : null;
}

/**
 * Connects a Google account to a signed-in customer, so either way of logging
 * in opens the same account. Fills in the email from Google if there was none.
 */
export async function linkGoogle(customerId: number, sub: string, email: string) {
  const db = await getDb();
  const { rows } = await db.query<{ id: number }>(
    `UPDATE customers SET google_sub = $2, email = COALESCE(email, $3)
     WHERE id = $1 AND google_sub IS NULL
       AND NOT EXISTS (SELECT 1 FROM customers WHERE google_sub = $2)
     RETURNING id`,
    [customerId, sub, email],
  );
  return rows.length > 0;
}

export async function findCustomerByPhone(phone: string) {
  const db = await getDb();
  const { rows } = await db.query<CustomerRow>("SELECT * FROM customers WHERE phone = $1", [phone]);
  return rows[0] ?? null;
}

export async function getCustomer(id: number): Promise<Customer | null> {
  const db = await getDb();
  const { rows } = await db.query<CustomerRow>("SELECT * FROM customers WHERE id = $1", [id]);
  return rows[0] ? toCustomer(rows[0]) : null;
}

export async function noteLogin(id: number) {
  const db = await getDb();
  await db.query("UPDATE customers SET last_login_at = now() WHERE id = $1", [id]);
  await claimGuestOrders(id);
}

/** Adds guest orders placed from the account's number, once that number is verified. */
export async function claimGuestOrders(customerId: number) {
  const db = await getDb();
  await db.query(
    `UPDATE orders o SET customer_id = c.id FROM customers c
     WHERE c.id = $1 AND c.phone_verified_at IS NOT NULL
       AND o.customer_id IS NULL AND o.phone = c.phone`,
    [customerId],
  );
}

/** Remembers the address from the latest order so the next checkout is one tap. */
export async function saveCustomerAddress(id: number, a: {
  name: string; email: string | null; address: string; city: string; state: string; pincode: string;
}) {
  const db = await getDb();
  await db.query(
    `UPDATE customers SET name = $2, email = COALESCE($3, email), address = $4,
       city = $5, state = $6, pincode = $7 WHERE id = $1`,
    [id, a.name, a.email, a.address, a.city, a.state, a.pincode],
  );
}

// ── Wishlist ───────────────────────────────────────────────────────────────

export async function getWishlist(customerId: number): Promise<number[]> {
  const db = await getDb();
  const { rows } = await db.query<{ product_id: number }>(
    "SELECT product_id FROM wishlist WHERE customer_id = $1 ORDER BY created_at DESC",
    [customerId],
  );
  return rows.map((r) => r.product_id);
}

export async function getWishlistProducts(customerId: number): Promise<Product[]> {
  const db = await getDb();
  const { rows } = await db.query<ProductRow>(
    `SELECT p.* FROM products p
     JOIN wishlist w ON w.product_id = p.id
     WHERE w.customer_id = $1 AND NOT p.hidden AND p.deleted_at IS NULL
     ORDER BY w.created_at DESC`,
    [customerId],
  );
  return rows.map(toProduct);
}

export async function addToWishlist(customerId: number, productId: number) {
  const db = await getDb();
  await db.query(
    "INSERT INTO wishlist (customer_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [customerId, productId],
  );
}

export async function removeFromWishlist(customerId: number, productId: number) {
  const db = await getDb();
  await db.query("DELETE FROM wishlist WHERE customer_id = $1 AND product_id = $2", [customerId, productId]);
}

// ── Order history ──────────────────────────────────────────────────────────

export interface OrderSummary {
  code: string;
  status: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  total: number;
  items: OrderItem[];
  placedAt: string;
}

export async function getCustomerOrders(customerId: number): Promise<OrderSummary[]> {
  const db = await getDb();
  const { rows } = await db.query<{
    code: string; status: string; payment_method: PaymentMethod; payment_status: string;
    total: number; items: OrderItem[] | string; created_at: Date | string;
  }>(
    `SELECT code, status, payment_method, payment_status, total, items, created_at
     FROM orders WHERE customer_id = $1 ORDER BY id DESC LIMIT 50`,
    [customerId],
  );
  return rows.map((r) => ({
    code: r.code,
    status: r.status,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    total: r.total,
    items: typeof r.items === "string" ? JSON.parse(r.items) : r.items,
    placedAt: new Date(r.created_at).toISOString(),
  }));
}
