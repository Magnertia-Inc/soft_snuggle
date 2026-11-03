// The single source of truth for categories. lib/schema.ts builds the database
// CHECK constraint from this list, so adding one here reaches the database too.
// They used to be two separate lists, and adding "nappy" to the type without
// the constraint took every page down with a 23514.
export const CATEGORIES = ["frock", "jabla", "nappy", "set", "bodysuit", "romper", "gift-set"] as const;

export type Category = (typeof CATEGORIES)[number];

export interface ColourOption {
  name: string;
  hex: string;
  /** Optional photo for this colour (path under /public). Falls back to the product photos. */
  image?: string;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  category: Category;
  fabric: string;
  colour: string;
  price: number;
  compareAt: number | null;
  badge: string | null;
  organic: boolean;
  sizes: string[];
  ageGroups: string[];
  description: string;
  care: string;
  /** Card background colour */
  tint: string;
  /** Colour the garment illustration is drawn in */
  garment: string;
  inStock: boolean;
  /** Sizes the owner has marked sold out; the rest of the product can still be bought */
  soldOutSizes: string[];
  /** Colour choices shown as round swatches on the product page */
  colours: ColourOption[];
  /** Photos: the ones uploaded in the admin panel, else public/products/<slug>; empty means use the illustration */
  images: string[];
  /** Kept out of the shop by the owner; only the admin panel sees it */
  hidden: boolean;
}

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  category: Category;
  price: number;
  size: string;
  colour?: string;
  qty: number;
  tint: string;
  garment: string;
  image?: string;
}

export interface OrderItem {
  productId: number;
  name: string;
  size: string;
  colour?: string;
  qty: number;
  price: number;
}

export type PaymentMethod = "upi" | "cod";

export interface Order {
  code: string;
  accessKey: string;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: OrderItem[];
  subtotal: number;
  /** Taken off by a coupon; 0 when none was used */
  discount: number;
  couponCode: string | null;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  utr: string | null;
  createdAt: string;
}
