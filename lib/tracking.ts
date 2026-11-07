// Shared by the tracking page (browser) and the tracking API (server).

export const TRACK_STEPS = [
  { key: "new", label: "Order placed", note: "We've received your order." },
  { key: "confirmed", label: "Order confirmed", note: "Payment checked and order confirmed." },
  { key: "packed", label: "Packed", note: "Folded with love and ready to go." },
  { key: "shipped", label: "Shipped", note: "On its way with our courier partner." },
  { key: "out_for_delivery", label: "Out for delivery", note: "Arriving today." },
  { key: "delivered", label: "Delivered", note: "Enjoy the snuggles!" },
] as const;

export type TrackStatus = (typeof TRACK_STEPS)[number]["key"] | "cancelled";

export interface TrackInfo {
  code: string;
  status: TrackStatus;
  paymentMethod: "upi" | "cod";
  paymentStatus: string;
  total: number;
  items: { name: string; size: string; colour?: string; qty: number }[];
  city: string;
  pincode: string;
  placedAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  updatedAt: string;
  courier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
}

/** Accepts "SS-1042", "ss1042" or just "1042". */
export function normaliseOrderCode(input: string) {
  const digits = input.replace(/\D/g, "");
  return digits ? `SS-${digits}` : "";
}

/** The courier's own link if the owner saved one, otherwise a search that finds the courier's tracking page. */
export function courierLink(courier: string | null, number: string | null, url: string | null) {
  if (url) return url;
  if (!number) return null;
  return `https://www.google.com/search?q=${encodeURIComponent(`${courier ?? "courier"} tracking ${number}`)}`;
}
