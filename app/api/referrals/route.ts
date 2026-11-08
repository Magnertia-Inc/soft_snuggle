import { NextResponse } from "next/server";
import { myReferrals, referralLink } from "@/lib/referrals";
import { publicSiteUrl } from "@/lib/site";
import { currentCustomer } from "@/lib/session";

/** The signed-in customer's referral code, share link and RE10 rewards. */
export async function GET() {
  const customer = await currentCustomer();
  if (!customer) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  try {
    const mine = await myReferrals(customer.id, customer.phone);
    return NextResponse.json({ ...mine, link: referralLink(publicSiteUrl(), mine.code) });
  } catch (err) {
    console.error("referrals failed", err);
    return NextResponse.json({ error: "We couldn't load your referral code. Please try again." }, { status: 500 });
  }
}
