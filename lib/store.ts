// Store settings shared by the browser and the server.

export const STORE = {
  name: "Veviba",
  // The shop's one phone number, used everywhere on the site. Fixed here on
  // purpose (not read from an env variable) so an old value in a .env or on
  // the host can't bring back a different number.
  whatsappNumber: "917708100362",
  // Delivery is free on every order.
  //
  // This deliberately ignores NEXT_PUBLIC_SHIPPING_FLAT. That variable is
  // baked in when the server starts, so a stale 79 left in a local .env kept
  // coming back at checkout however many times the default changed. The
  // number lives here instead, where it is the same for everyone.
  //
  // To charge for delivery again, put the amount here. The wording around the
  // site follows it: 0 reads "free on all orders", anything else goes back to
  // "free over <threshold>" with the cart's countdown and progress bar.
  shippingFlat: 29,
  freeShippingAbove: Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_ABOVE ?? 1499),
  codFee: 7,
  instagram: "https://www.instagram.com/veviba.baby",
  // The shop's one email address, used everywhere on the site: shown to
  // customers, and where every new-order email is sent.
  email: "veviba2026@gmail.com",
};

/**
 * The thank-you for leaving feedback on an order: this code takes `percent`
 * off the items of a later order, once per mobile number, within `days` of
 * the feedback. The coupon row itself is created in lib/schema.ts.
 */
export const FEEDBACK_REWARD = { code: "FBK5", percent: 5, days: 30 } as const;

/** Shown beside shipping wherever it appears: prices already include all taxes. */
export const SHIPPING_LABEL = "Shipping";
/** The grand total's label: every price already includes all taxes. */
export const TOTAL_LABEL = "Total (incl. all taxes)";
/** What the items cost before any discount or shipping. */
export const SELLING_LABEL = "Selling price";
/** Rounds money to the paisa (e.g. a 10% discount on ₹398 is ₹39.80). */
export const paise = (n: number) => Math.round(n * 100) / 100;

/** The WhatsApp number as people read it, e.g. "+91 77081 00362". */
export const whatsappDisplay = STORE.whatsappNumber.replace(/^(\d{2})(\d{5})(\d+)$/, "+$1 $2 $3");

export const AGE_GROUPS = [
  { slug: "newborn", title: "Newborn", range: "0–3 months", tint: "#DFE7DD", sizes: ["0–3M"] },
  { slug: "little-one", title: "Little One", range: "3–6 months", tint: "#F3D8C8", sizes: ["3–6M"] },
  { slug: "sitting-up", title: "Sitting Up", range: "6–9 months", tint: "#DCE6EE", sizes: ["6–9M"] },
  { slug: "on-the-move", title: "On the Move", range: "9–12 months", tint: "#F1E7BC", sizes: ["9–12M"] },
  { slug: "toddler", title: "Toddler", range: "1–3 years", tint: "#E8E3EF", sizes: ["12–18M", "18–24M", "2–3Y"] },
] as const;

/** The standard sizes, youngest first, offered as tick boxes in the product editor. */
export const STANDARD_SIZES: string[] = AGE_GROUPS.flatMap((g) => g.sizes);

/** The Shop by age groups a product appears under, worked out from its sizes. */
export function ageGroupsFor(sizes: string[]): string[] {
  return AGE_GROUPS.filter((g) => g.sizes.some((s) => sizes.includes(s))).map((g) => g.slug);
}

export const CATEGORY_LABELS = {
  frock: "Frocks",
  jabla: "Jablas",
  nappy: "Nappies",
  set: "Sets",
  bodysuit: "Bodysuits",
  romper: "Rompers",
  "gift-set": "Gift Sets",
} as const;

/** Taken off sale, or every size marked sold out in the admin panel. */
export function isSoldOut(p: { inStock: boolean; sizes: string[]; soldOutSizes: string[] }) {
  return !p.inStock || p.sizes.every((s) => p.soldOutSizes.includes(s));
}

export function shippingFor(subtotal: number) {
  if (subtotal === 0 || subtotal >= STORE.freeShippingAbove) return 0;
  return STORE.shippingFlat;
}

export function codFeeFor(method: string) {
  return method === "cod" ? STORE.codFee : 0;
}

/** True while delivery costs nothing whatever the order comes to. */
export const shippingIsFree = STORE.shippingFlat === 0;

/** The shipping promise, as one short line. */
export const shippingLine = shippingIsFree
  ? "Free shipping on all orders"
  : `Free shipping over ${inr(STORE.freeShippingAbove)}`;

export function inr(amount: number) {
  const n = Number(amount);
  // Whole rupees show as ₹398; amounts with paise show both digits, ₹39.80.
  const paiseShown = Math.round(n * 100) % 100 !== 0;
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: paiseShown ? 2 : 0, maximumFractionDigits: 2 });
}

/**
 * What a mobile-number box keeps as it's typed or pasted: the 10 digits,
 * so "+91 98765 43210" and "098765 43210" both become 9876543210.
 */
export function phoneDigits(raw: string) {
  const d = raw.replace(/\D/g, "");
  return (d.length > 10 ? d.replace(/^(91|0)/, "") : d).slice(0, 10);
}

/** The struck-out price shown beside every product: 10% above the selling
 *  price, rounded up to end in 9 (₹349 -> ₹389, ₹199 -> ₹219).
 *  A product with its own "compare at" price set in the admin panel uses that. */
/** How much cheaper than the struck-out price, as a whole percentage (e.g. 10). */
export function percentOff(price: number, compareAt: number | null | undefined): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function listPrice(price: number): number {
  return Math.ceil((price * 1.1) / 10) * 10 - 1;
}

/** Every order reaches the customer within this many days of being placed. */
export const DELIVERY_DAYS = 7;

/** The date an order placed on `from` arrives by, e.g. "Fri, 13 Nov" (India time). */
export function deliveryBy(from: Date | string = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + DELIVERY_DAYS);
  return d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" });
}

/** The largest size of a product costs this much more than its other sizes. */
export const LARGEST_SIZE_EXTRA = 10;

/** True when `size` is the biggest size a product comes in (the last in its list). */
export function isLargestSize(sizes: string[], size: string | null | undefined): boolean {
  return !!size && sizes.length > 1 && size === sizes[sizes.length - 1];
}

/** A product's price for one size: the largest size is ₹10 more. */
export function priceForSize(p: { price: number; sizes: string[] }, size: string | null | undefined): number {
  return p.price + (isLargestSize(p.sizes, size) ? LARGEST_SIZE_EXTRA : 0);
}
