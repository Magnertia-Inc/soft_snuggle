// Words and colours for the admin panel, shared by its server pages and the
// buttons that run in the browser.

export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_TONES: Record<string, string> = {
  new: "bg-butter",
  confirmed: "bg-sky",
  packed: "bg-peach",
  shipped: "bg-sage",
  out_for_delivery: "bg-sage",
  delivered: "bg-sage-deep text-paper",
  cancelled: "bg-line text-ink-soft",
};

export function paymentLabel(method: string, status: string) {
  if (method === "cod") return "Cash on delivery";
  if (status === "paid") return "UPI · paid";
  if (status === "submitted") return "UPI · UTR to check";
  return "UPI · not paid yet";
}

/** Payment that needs the owner to do something stands out. */
export const paymentNeedsLook = (method: string, status: string) => method === "upi" && status !== "paid";

export const EVENT_LABELS: Record<string, string> = {
  placed: "Order placed",
  utr_submitted: "Customer sent UTR",
  confirm: "Confirmed",
  pack: "Packed",
  ship: "Shipped",
  out_for_delivery: "Out for delivery",
  deliver: "Delivered",
  cancel: "Cancelled",
  reopen: "Reopened",
  tracking: "Tracking changed",
  note: "Note",
  whatsapp: "WhatsApp received",
  feedback: "Customer feedback",
  feedback_mail: "Feedback email sent",
  review: "Customer review",
};

/** "31 Oct, 4:05 pm" in Indian time, whatever zone the server runs in. */
export function when(iso: string, withYear = false) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Couriers offered as suggestions when shipping; any other name can be typed. */
export const COURIERS = [
  "Shiprocket", "Delhivery", "DTDC", "India Post", "Blue Dart", "Xpressbees", "Ecom Express", "Ekart", "Shadowfax",
  "Professional Couriers", "ST Courier",
];
