import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { CouponError, deleteCoupon, setCouponActive } from "@/lib/coupons";
import { fromOwnSite } from "@/lib/site";

type Ctx = { params: Promise<{ id: string }> };

async function guard(req: Request, { params }: Ctx) {
  const admin = await currentAdmin();
  if (!admin) return { error: NextResponse.json({ error: "Please sign in again." }, { status: 401 }) };
  if (!fromOwnSite(req)) return { error: NextResponse.json({ error: "Invalid request." }, { status: 403 }) };
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return { error: NextResponse.json({ error: "Invalid request." }, { status: 400 }) };
  return { admin, id };
}

/** Switches a code on or off. */
export async function POST(req: Request, ctx: Ctx) {
  const g = await guard(req, ctx);
  if (g.error) return g.error;
  const body = await req.json().catch(() => ({}));
  if (typeof body.active !== "boolean") return NextResponse.json({ error: "Nothing to change." }, { status: 400 });

  try {
    await setCouponActive(g.id, body.active);
    console.info(`coupon ${g.id} ${body.active ? "switched on" : "switched off"} by ${g.admin.email}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof CouponError) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("coupon update failed", err);
    return NextResponse.json({ error: "That didn't save. Please try again." }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const g = await guard(req, ctx);
  if (g.error) return g.error;

  try {
    await deleteCoupon(g.id);
    console.info(`coupon ${g.id} deleted by ${g.admin.email}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof CouponError) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("coupon delete failed", err);
    return NextResponse.json({ error: "That didn't delete. Please try again." }, { status: 500 });
  }
}
