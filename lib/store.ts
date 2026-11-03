// Store settings shared by the browser and the server.

export const STORE = {
  name: "Soft Snuggle",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919585692553",
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
  shippingFlat: 0,
  freeShippingAbove: Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_ABOVE ?? 1499),
  instagram: "https://instagram.com/",
  // No public email address: customers reach the shop on WhatsApp.
};

/** The WhatsApp number as people read it, e.g. "+91 95856 92553". */
export const whatsappDisplay = STORE.whatsappNumber.replace(/^(\d{2})(\d{5})(\d+)$/, "+$1 $2 $3");

export const AGE_GROUPS = [
  { slug: "newborn", title: "Newborn", range: "0–3 months", tint: "#DFE7DD", sizes: ["0–3M"] },
  { slug: "little-one", title: "Little One", range: "3–6 months", tint: "#F3D8C8", sizes: ["3–6M"] },
  { slug: "sitting-up", title: "Sitting Up", range: "6–9 months", tint: "#DCE6EE", sizes: ["6–9M"] },
  { slug: "on-the-move", title: "On the Move", range: "9–12 months", tint: "#F1E7BC", sizes: ["9–12M"] },
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

/** True while delivery costs nothing whatever the order comes to. */
export const shippingIsFree = STORE.shippingFlat === 0;

/** The shipping promise, as one short line. */
export const shippingLine = shippingIsFree
  ? "Free shipping on all orders"
  : `Free shipping over ${inr(STORE.freeShippingAbove)}`;

export function inr(amount: number) {
  return "₹" + amount.toLocaleString("en-IN");
}
