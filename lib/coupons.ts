import { getDb } from "./db";
import { rewardEndsFor } from "./feedback";
import { FEEDBACK_REWARD, inr } from "./store";

// Discount codes the owner creates in the admin panel. A code takes either a
// percentage or a fixed amount off the items (never off shipping), and can be
// limited by a minimum order, an expiry date, a total number of uses and one
// use per phone number.

export type CouponKind = "percent" | "flat";

export interface Coupon {
  id: number;
  code: string;
  kind: CouponKind;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  expiresAt: string | null;
  maxUses: number | null;
  oncePerPhone: boolean;
  usedCount: number;
  active: boolean;
  createdAt: string;
}

type CouponRow = {
  id: number; code: string; kind: CouponKind; value: number; min_order: number;
  max_discount: number | null; expires_at: Date | string | null; max_uses: number | null;
  once_per_phone: boolean; used_count: number; active: boolean; created_at: Date | string;
};

const toCoupon = (r: CouponRow): Coupon => ({
  id: r.id, code: r.code, kind: r.kind, value: r.value, minOrder: r.min_order,
  maxDiscount: r.max_discount, expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
  maxUses: r.max_uses, oncePerPhone: r.once_per_phone, usedCount: r.used_count, active: r.active,
  createdAt: new Date(r.created_at).toISOString(),
});

/** Codes are typed in any case and with stray spaces; they are kept in capitals. */
export const normaliseCode = (code: string) => code.replace(/\s+/g, "").toUpperCase();

/** The shopper-facing reason a code can't be used. */
export class CouponError extends Error {}

/** What the code takes off this subtotal. Never more than the items cost. */
export function discountFor(c: Pick<Coupon, "kind" | "value" | "maxDiscount">, subtotal: number) {
  // Percent codes are exact to the paisa: 10% of ₹398 is ₹39.80
  const raw = c.kind === "percent" ? Math.round(subtotal * c.value) / 100 : c.value;
  const capped = c.maxDiscount != null ? Math.min(raw, c.maxDiscount) : raw;
  return Math.max(0, Math.min(capped, subtotal));
}

/** "10% off (up to ₹200)" or "₹100 off". */
export function describeCoupon(c: Pick<Coupon, "kind" | "value" | "maxDiscount">) {
  if (c.kind === "flat") return `${inr(c.value)} off`;
  return `${c.value}% off${c.maxDiscount != null ? ` (up to ${inr(c.maxDiscount)})` : ""}`;
}

/**
 * Checks a code against an order's subtotal and, when known, the shopper's
 * phone number. Throws CouponError with a message to show the shopper.
 */
export async function checkCoupon(rawCode: string, subtotal: number, phone?: string | null) {
  const code = normaliseCode(rawCode);
  const db = await getDb();
  const { rows } = await db.query<CouponRow>("SELECT * FROM coupons WHERE code = $1", [code]);
  const c = rows[0] ? toCoupon(rows[0]) : null;

  if (!c || !c.active) throw new CouponError("That code isn't valid.");
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) throw new CouponError("That code has expired.");
  if (c.maxUses != null && c.usedCount >= c.maxUses) throw new CouponError("That code has been fully used.");
  // The feedback thank-you only works for a number that rated an order recently.
  if (c.code === FEEDBACK_REWARD.code) {
    if (!phone) throw new CouponError(`Enter your mobile number above first: ${c.code} works with the number you left feedback with.`);
    const ends = await rewardEndsFor(phone);
    if (!ends) {
      throw new CouponError(`${c.code} is our thank-you for rating an order. It works with the mobile number you left feedback with.`);
    }
    if (ends.getTime() < Date.now()) {
      throw new CouponError(`${c.code} works for ${FEEDBACK_REWARD.days} days after your feedback, and that time has passed.`);
    }
  }
  if (subtotal < c.minOrder) {
    throw new CouponError(`${c.code} works on orders of ${inr(c.minOrder)} or more. Add ${inr(c.minOrder - subtotal)} more to use it.`);
  }
  if (c.oncePerPhone && phone) {
    const used = await db.query(
      "SELECT 1 FROM orders WHERE coupon_code = $1 AND right(phone, 10) = $2 AND status <> 'cancelled' LIMIT 1",
      [c.code, phone.slice(-10)],
    );
    if (used.rows.length) throw new CouponError("You've already used this code on an earlier order.");
  }
  return { coupon: c, discount: discountFor(c, subtotal) };
}

/**
 * Takes one use of the code for an order being placed. The limit is checked
 * inside the UPDATE, so two shoppers can't both take the last use.
 */
export async function claimCoupon(id: number) {
  const db = await getDb();
  const { rows } = await db.query(
    `UPDATE coupons SET used_count = used_count + 1
     WHERE id = $1 AND active AND (max_uses IS NULL OR used_count < max_uses) RETURNING id`,
    [id],
  );
  return rows.length > 0;
}

/** Gives a use back, when its order is cancelled or never got saved. */
export async function releaseCoupon(code: string) {
  const db = await getDb();
  await db.query("UPDATE coupons SET used_count = GREATEST(used_count - 1, 0) WHERE code = $1", [code]);
}

/** Counts a use again when a cancelled order is reopened. */
export async function reclaimCoupon(code: string) {
  const db = await getDb();
  await db.query("UPDATE coupons SET used_count = used_count + 1 WHERE code = $1", [code]);
}

// ── Admin ──────────────────────────────────────────────────────────────────

export async function listCoupons(): Promise<Coupon[]> {
  const db = await getDb();
  const { rows } = await db.query<CouponRow>("SELECT * FROM coupons ORDER BY active DESC, created_at DESC");
  return rows.map(toCoupon);
}

export interface CouponInput {
  code: string;
  kind: CouponKind;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  /** The last day it works, YYYY-MM-DD, India time */
  expiresOn: string | null;
  maxUses: number | null;
  oncePerPhone: boolean;
}

export async function createCoupon(input: CouponInput, actor: string) {
  const code = normaliseCode(input.code);
  if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
    throw new CouponError("Codes are 3 to 20 letters or numbers, with no spaces (e.g. WELCOME10).");
  }
  if (input.kind === "percent" && (input.value < 1 || input.value > 100)) throw new CouponError("A percentage is between 1 and 100.");
  if (input.kind === "flat" && (input.value < 1 || input.value > 100000)) throw new CouponError("Enter how many rupees it takes off.");
  if (input.minOrder < 0) throw new CouponError("The minimum order can't be negative.");
  if (input.maxDiscount != null && input.maxDiscount < 1) throw new CouponError("The most it takes off must be at least ₹1.");
  if (input.maxUses != null && input.maxUses < 1) throw new CouponError("Allow at least one use, or leave it empty for no limit.");

  let expiresAt: string | null = null;
  if (input.expiresOn) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.expiresOn)) throw new CouponError("Pick the last day the code works.");
    // Good until the end of that day in India, whatever the server's clock says.
    expiresAt = `${input.expiresOn}T23:59:59+05:30`;
    if (new Date(expiresAt).getTime() < Date.now()) throw new CouponError("That date has already passed.");
  }

  const db = await getDb();
  const taken = await db.query("SELECT 1 FROM coupons WHERE code = $1", [code]);
  if (taken.rows.length) throw new CouponError(`${code} already exists. Pick another code.`);
  await db.query(
    `INSERT INTO coupons (code, kind, value, min_order, max_discount, expires_at, max_uses, once_per_phone, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      code, input.kind, input.value, input.minOrder,
      input.kind === "percent" ? input.maxDiscount : null,
      expiresAt, input.maxUses, input.oncePerPhone, actor,
    ],
  );
  return code;
}

export async function setCouponActive(id: number, active: boolean) {
  const db = await getDb();
  const { rows } = await db.query("UPDATE coupons SET active = $2 WHERE id = $1 RETURNING id", [id, active]);
  if (!rows.length) throw new CouponError("That code no longer exists.");
}

/** Only an unused code can be deleted; a used one is switched off instead, so past orders still make sense. */
export async function deleteCoupon(id: number) {
  const db = await getDb();
  const { rows } = await db.query<{ code: string; used_count: number }>("SELECT code, used_count FROM coupons WHERE id = $1", [id]);
  if (!rows[0]) return;
  if (rows[0].code === FEEDBACK_REWARD.code) {
    throw new CouponError(`${rows[0].code} is the thank-you code customers get for feedback. Switch it off instead.`);
  }
  const used = await db.query("SELECT 1 FROM orders WHERE coupon_code = $1 LIMIT 1", [rows[0].code]);
  if (rows[0].used_count > 0 || used.rows.length) {
    throw new CouponError("This code has been used on orders, so it can only be switched off.");
  }
  await db.query("DELETE FROM coupons WHERE id = $1", [id]);
}
