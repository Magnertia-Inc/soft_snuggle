import { NextResponse } from "next/server";
import { ReferralError, checkReferral } from "@/lib/referrals";
import { currentCustomer } from "@/lib/session";

/** Checks a friend's referral code at checkout, before the order is placed. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.slice(0, 40) : "";
  const customer = await currentCustomer();
  const phone = (typeof body.phone === "string" ? body.phone : customer?.phone ?? "").replace(/\D/g, "").slice(-10);
  if (!code.trim()) return NextResponse.json({ error: "Enter your friend's code." }, { status: 422 });
  try {
    const r = await checkReferral(code, { customerId: customer?.id ?? null, phone });
    return NextResponse.json({ code: r.code, referrer: r.name });
  } catch (err) {
    if (err instanceof ReferralError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("referral check failed", err);
    return NextResponse.json({ error: "We couldn't check that code. Please try again." }, { status: 500 });
  }
}
