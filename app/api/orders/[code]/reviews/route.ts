import { NextResponse, after } from "next/server";
import { FeedbackError, rewardIsOn } from "@/lib/feedback";
import { sendRewardMail } from "@/lib/feedback-mail";
import { emailSiteUrl } from "@/lib/order-emails";
import { BODY_MAX, saveReview } from "@/lib/reviews";
import { siteOrigin } from "@/lib/site";
import { REVIEW_REWARD } from "@/lib/store";

/** Saves a review of one piece in an order, from its feedback page (which knows the order's key). */
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await req.json().catch(() => ({}));
  const key = typeof body.key === "string" ? body.key : "";
  const text = typeof body.body === "string" ? body.body : "";
  if (text.length > BODY_MAX * 2) return NextResponse.json({ error: "That's a bit long. Please shorten it." }, { status: 422 });

  try {
    const saved = await saveReview(code, key, Number(body.productId), Number(body.rating), text);
    if (!saved) return NextResponse.json({ error: "We couldn't find this order." }, { status: 404 });
    // The code is emailed once per order, with its first review.
    if (saved.created && saved.firstForOrder) {
      const site = emailSiteUrl(siteOrigin(req));
      after(() => sendRewardMail(saved.order, REVIEW_REWARD, site).then(() => {}).catch((err) => console.error("review reward email failed", err)));
    }
    return NextResponse.json({ review: saved.review, rewardOn: await rewardIsOn(REVIEW_REWARD.code) });
  } catch (err) {
    if (err instanceof FeedbackError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("review failed", err);
    return NextResponse.json({ error: "We couldn't save that. Please try again." }, { status: 500 });
  }
}
