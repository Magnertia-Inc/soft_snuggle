import { getDb } from "./db";
import { sendMail } from "./mail";
import { INK, button, esc, layout } from "./order-emails";
import { REFERRAL_REWARD } from "./store";

// Refer & earn.
//   - Every account has a personal code, e.g. RE10-MEENA, shown on its account
//     page with a link to share (/r/RE10-MEENA).
//   - A friend enters it at checkout ("Referred by a friend?"). It is not a
//     discount: the friend pays the normal price and can still use a discount code.
//     It only counts on the friend's first order, and never for your own number.
//   - When that order is marked delivered, the referrer earns one RE10: 10% off
//     one order, valid 30 days, emailed to them if their account has an email.
//   - RE10 then works at checkout for the referrer's number, once per reward.
//     Cancelling the order it was used on gives the reward back.

const DAY = 86_400_000;
export class ReferralError extends Error {}

/** "re10 - meena" → "RE10-MEENA"; a bare "MEENA" gets the prefix added. */
export function normaliseReferral(raw: string) {
  const s = (raw || "").toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (!s) return "";
  if (s.startsWith(REFERRAL_REWARD.prefix)) return s;
  if (s.startsWith("RE10") && s.length > 4) return `${REFERRAL_REWARD.prefix}${s.slice(4).replace(/^-+/, "")}`;
  return `${REFERRAL_REWARD.prefix}${s.replace(/^-+/, "")}`;
}

/** Looks like a friend's personal code rather than a discount code. */
export const isReferralCode = (raw: string) => normaliseReferral(raw).length > REFERRAL_REWARD.prefix.length && /^RE10-?[A-Z]/i.test(raw.replace(/\s/g, ""));

/** "Meena Feedback" → "Meena F." */
export function shortName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "A Veviba parent";
  const first = parts[0][0].toUpperCase() + parts[0].slice(1);
  return parts.length > 1 ? `${first} ${parts[parts.length - 1][0].toUpperCase()}.` : first;
}

/** The account's code, made the first time it's asked for: RE10-MEENA, or RE10-MEENA27 if that's taken. */
export async function ensureReferralCode(customerId: number): Promise<string> {
  const db = await getDb();
  const { rows } = await db.query<{ referral_code: string | null; name: string }>(
    "SELECT referral_code, name FROM customers WHERE id = $1",
    [customerId],
  );
  if (!rows[0]) throw new ReferralError("Account not found.");
  if (rows[0].referral_code) return rows[0].referral_code;

  const base = (rows[0].name.trim().split(/\s+/)[0] ?? "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8) || "FRIEND";
  for (let attempt = 0; attempt < 12; attempt++) {
    const suffix = attempt === 0 ? "" : String(10 + Math.floor(Math.random() * (attempt < 6 ? 90 : 9990)));
    const code = `${REFERRAL_REWARD.prefix}${base}${suffix}`;
    try {
      const set = await db.query<{ referral_code: string }>(
        `UPDATE customers SET referral_code = COALESCE(referral_code, $2) WHERE id = $1 RETURNING referral_code`,
        [customerId, code],
      );
      return set.rows[0].referral_code;
    } catch (err) {
      if ((err as { code?: string }).code !== "23505") throw err; // taken: try another
    }
  }
  throw new ReferralError("We couldn't make your referral code. Please try again.");
}

export interface Referrer {
  id: number;
  name: string;
  code: string;
}

/**
 * Checks a friend's code for an order about to be placed by this account and
 * number. Throws ReferralError with a message for the shopper.
 */
export async function checkReferral(raw: string, who: { customerId: number | null; phone: string }): Promise<Referrer> {
  const code = normaliseReferral(raw);
  const db = await getDb();
  const { rows } = await db.query<{ id: number; name: string; phone: string; referral_code: string }>(
    "SELECT id, name, phone, referral_code FROM customers WHERE referral_code = $1",
    [code],
  );
  const r = rows[0];
  if (!r) throw new ReferralError("We couldn't find that referral code. Check it with your friend.");
  const phone = who.phone.slice(-10);
  if (r.id === who.customerId || r.phone === phone) {
    throw new ReferralError("That's your own referral code. Share it with friends instead!");
  }
  const earlier = await db.query(
    `SELECT 1 FROM orders WHERE status <> 'cancelled' AND (right(phone, 10) = $1 OR ($2::int IS NOT NULL AND customer_id = $2)) LIMIT 1`,
    [phone, who.customerId],
  );
  if (earlier.rows.length) throw new ReferralError("Referral codes are for a friend's first order with us, and you've ordered before.");
  return { id: r.id, name: shortName(r.name), code: r.referral_code };
}

export interface EarnedReward {
  rewardId: number;
  referrerName: string;
  referrerEmail: string | null;
  referrerPhone: string;
  friendName: string;
  expiresAt: string;
}

/**
 * Called when an order is marked delivered. If a friend's code was on it, the
 * referrer earns one RE10. Returns what was earned, for the email, or null.
 */
export async function earnReferral(orderId: number): Promise<EarnedReward | null> {
  const db = await getDb();
  const { rows } = await db.query<{
    id: number; expires_at: Date | string; name: string; email: string | null; phone: string; friend: string;
  }>(
    `WITH o AS (SELECT id, referred_by, customer_name, right(phone, 10) AS phone FROM orders
                WHERE id = $1 AND status = 'delivered' AND referred_by IS NOT NULL)
     INSERT INTO referral_rewards (referrer_id, friend_order_id, friend_phone, expires_at)
     SELECT o.referred_by, o.id, o.phone, now() + make_interval(days => $2::int) FROM o
     ON CONFLICT DO NOTHING
     RETURNING id, expires_at,
       (SELECT name FROM customers WHERE id = referrer_id) AS name,
       (SELECT email FROM customers WHERE id = referrer_id) AS email,
       (SELECT phone FROM customers WHERE id = referrer_id) AS phone,
       (SELECT customer_name FROM orders WHERE id = friend_order_id) AS friend`,
    [orderId, REFERRAL_REWARD.days],
  );
  const r = rows[0];
  if (!r) return null;
  await db.query("INSERT INTO order_events (order_id, kind, note, actor) VALUES ($1, 'referral_reward', $2, 'system')", [
    orderId,
    `${r.name} earned ${REFERRAL_REWARD.code} for referring this order`,
  ]);
  return {
    rewardId: r.id, referrerName: r.name, referrerEmail: r.email, referrerPhone: r.phone, friendName: r.friend,
    expiresAt: new Date(r.expires_at).toISOString(),
  };
}

/** RE10 rewards the account on this number can still use. */
export async function referralCredit(phone: string) {
  const db = await getDb();
  const { rows } = await db.query<{ available: number; earned: number; next_expiry: Date | string | null }>(
    `SELECT count(*) FILTER (WHERE r.used_order_id IS NULL AND r.expires_at > now())::int AS available,
            count(*)::int AS earned,
            min(r.expires_at) FILTER (WHERE r.used_order_id IS NULL AND r.expires_at > now()) AS next_expiry
     FROM referral_rewards r JOIN customers c ON c.id = r.referrer_id WHERE c.phone = $1`,
    [phone.slice(-10)],
  );
  const r = rows[0];
  return { available: r?.available ?? 0, earned: r?.earned ?? 0, nextExpiry: r?.next_expiry ? new Date(r.next_expiry).toISOString() : null };
}

/** Marks the reward that expires soonest as used by this order. False if none was left. */
export async function claimReferralReward(orderId: number, phone: string) {
  const db = await getDb();
  const { rows } = await db.query(
    `UPDATE referral_rewards SET used_order_id = $1, used_at = now()
     WHERE id = (SELECT r.id FROM referral_rewards r JOIN customers c ON c.id = r.referrer_id
                 WHERE c.phone = $2 AND r.used_order_id IS NULL AND r.expires_at > now()
                 ORDER BY r.expires_at LIMIT 1)
       AND used_order_id IS NULL
     RETURNING id`,
    [orderId, phone.slice(-10)],
  );
  return rows.length > 0;
}

/** A cancelled order gives its RE10 back. */
export async function releaseReferralReward(orderId: number) {
  const db = await getDb();
  await db.query("UPDATE referral_rewards SET used_order_id = NULL, used_at = NULL WHERE used_order_id = $1", [orderId]);
}

export interface MyReferrals {
  code: string;
  /** Friends' orders placed with the code and not cancelled. */
  friendsOrdered: number;
  earned: number;
  available: number;
  nextExpiry: string | null;
  used: number;
}

export async function myReferrals(customerId: number, phone: string): Promise<MyReferrals> {
  const code = await ensureReferralCode(customerId);
  const db = await getDb();
  const [{ rows: o }, { rows: u }, credit] = await Promise.all([
    db.query<{ n: number }>("SELECT count(*)::int AS n FROM orders WHERE referred_by = $1 AND status <> 'cancelled'", [customerId]),
    db.query<{ n: number }>("SELECT count(*)::int AS n FROM referral_rewards WHERE referrer_id = $1 AND used_order_id IS NOT NULL", [customerId]),
    referralCredit(phone),
  ]);
  return { code, friendsOrdered: o[0]?.n ?? 0, earned: credit.earned, available: credit.available, nextExpiry: credit.nextExpiry, used: u[0]?.n ?? 0 };
}

/** Referral details shown on the admin order page. */
export async function referralForOrder(orderId: number) {
  const db = await getDb();
  const { rows } = await db.query<{ code: string | null; name: string | null; earned: boolean; used_reward: boolean }>(
    `SELECT o.referral_code AS code, c.name,
       EXISTS (SELECT 1 FROM referral_rewards r WHERE r.friend_order_id = o.id) AS earned,
       EXISTS (SELECT 1 FROM referral_rewards r WHERE r.used_order_id = o.id) AS used_reward
     FROM orders o LEFT JOIN customers c ON c.id = o.referred_by WHERE o.id = $1`,
    [orderId],
  );
  const r = rows[0];
  return r ? { code: r.code, referrerName: r.name, earned: r.earned, usedReward: r.used_reward } : null;
}

const lastDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

/** "Your friend's order arrived: here's 10% off." Only to referrers with an email on their account. */
export async function sendReferralRewardMail(r: EarnedReward, site: string) {
  if (!r.referrerEmail?.trim()) return false;
  const first = r.referrerName.trim().split(/\s+/)[0] || "there";
  const friend = r.friendName.trim().split(/\s+/)[0] || "Your friend";
  const until = lastDay(r.expiresAt);
  const html = layout(
    "Thank you for referring a friend!",
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.5">Hi ${esc(first)}, ${esc(friend)}'s Veviba order has reached them. Thank you for sharing us! Here's ${REFERRAL_REWARD.percent}% off your next order:</p>
<p style="margin:0"><span style="display:inline-block;border:2px dashed ${INK};border-radius:12px;padding:10px 18px;font-family:monospace;font-size:24px;font-weight:bold;letter-spacing:4px">${REFERRAL_REWARD.code}</span></p>
<p style="margin:14px 0 0;font-size:14px;line-height:1.5">Enter it at checkout with your mobile number (+91 ${esc(r.referrerPhone)}) by <b>${until}</b>. Each friend you refer earns you one more. Checkout takes one code per order.</p>
${button(`${site}/shop`, "Shop now")}`,
  );
  const text = [
    `Hi ${first}, ${friend}'s Veviba order has reached them. Thank you for referring them!`,
    "",
    `Here's ${REFERRAL_REWARD.percent}% off your next order: ${REFERRAL_REWARD.code}`,
    `Enter it at checkout with your mobile number (+91 ${r.referrerPhone}) by ${until}. Each friend you refer earns you one more; one code per order.`,
    "",
    `Shop: ${site}/shop`,
  ].join("\n");
  return sendMail({ to: [r.referrerEmail], subject: `Your friend's order arrived: ${REFERRAL_REWARD.percent}% off for you (${REFERRAL_REWARD.code})`, html, text });
}

export const referralLink = (site: string, code: string) => `${site}/r/${code}`;
export const referralDays = (iso: string | null) => (iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / DAY)) : 0);
