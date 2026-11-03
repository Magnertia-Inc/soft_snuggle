import { NextResponse } from "next/server";
import { CouponError, checkCoupon, describeCoupon } from "@/lib/coupons";

/**
 * Checks a discount code at checkout and says what it takes off. Only a
 * preview: the order is priced again on the server when it is placed.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.slice(0, 40) : "";
  const subtotal = Math.floor(Number(body.subtotal));
  const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "").slice(-10) : null;
  if (!code.trim()) return NextResponse.json({ error: "Enter a code." }, { status: 400 });
  if (!Number.isFinite(subtotal) || subtotal < 0) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  try {
    const { coupon, discount } = await checkCoupon(code, subtotal, phone && phone.length === 10 ? phone : null);
    return NextResponse.json({ code: coupon.code, discount, label: describeCoupon(coupon) });
  } catch (err) {
    if (err instanceof CouponError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("coupon check failed", err);
    return NextResponse.json({ error: "We couldn't check that code. Please try again." }, { status: 500 });
  }
}
