import { NextResponse } from "next/server";
import { normaliseReferral } from "@/lib/referrals";
import { publicSiteUrl } from "@/lib/site";

const REF_COOKIE = "veviba_ref"; // read by the checkout (CheckoutForm)

/**
 * A shared referral link, /r/RE10-MEENA: remembers the code for 30 days (the
 * checkout fills it in) and opens the shop.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = normaliseReferral(decodeURIComponent((await params).code)).slice(0, 40);
  const res = NextResponse.redirect(`${publicSiteUrl()}/shop`, 302);
  if (code) {
    res.cookies.set(REF_COOKIE, code, { maxAge: 30 * 24 * 60 * 60, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  }
  return res;
}
