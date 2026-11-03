import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { CouponError, createCoupon } from "@/lib/coupons";
import { fromOwnSite } from "@/lib/site";

const whole = (v: unknown) => (v === "" || v === null || v === undefined ? null : Math.floor(Number(v)));

/** Creates a discount code. */
export async function POST(req: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!fromOwnSite(req)) return NextResponse.json({ error: "Invalid request." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const value = whole(body.value);
  const minOrder = whole(body.minOrder) ?? 0;
  const maxDiscount = whole(body.maxDiscount);
  const maxUses = whole(body.maxUses);
  if ([value, minOrder, maxDiscount, maxUses].some((n) => n !== null && !Number.isFinite(n))) {
    return NextResponse.json({ error: "Numbers only in the amount boxes." }, { status: 422 });
  }

  try {
    const code = await createCoupon(
      {
        code: typeof body.code === "string" ? body.code : "",
        kind: body.kind === "flat" ? "flat" : "percent",
        value: value ?? 0,
        minOrder,
        maxDiscount,
        expiresOn: typeof body.expiresOn === "string" && body.expiresOn ? body.expiresOn : null,
        maxUses,
        oncePerPhone: body.oncePerPhone === true,
      },
      admin.email,
    );
    console.info(`coupon ${code} created by ${admin.email}`);
    return NextResponse.json({ code }, { status: 201 });
  } catch (err) {
    if (err instanceof CouponError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("coupon create failed", err);
    return NextResponse.json({ error: "That didn't save. Please try again." }, { status: 500 });
  }
}
