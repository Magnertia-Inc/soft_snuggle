import { NextResponse, after } from "next/server";
import { FeedbackError, readAnswers, rewardIsOn, saveFeedback } from "@/lib/feedback";
import { sendLowRatingAlert, sendRewardMail } from "@/lib/feedback-mail";
import { emailSiteUrl } from "@/lib/order-emails";
import { siteOrigin } from "@/lib/site";
import { FEEDBACK_REWARD } from "@/lib/store";

/** Saves the feedback form for an order, from its feedback page (which knows the order's key). */
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await req.json().catch(() => ({}));
  const key = typeof body.key === "string" ? body.key : "";

  try {
    const answers = readAnswers(body);
    const saved = await saveFeedback(code, key, answers);
    if (!saved) return NextResponse.json({ error: "We couldn't find this order." }, { status: 404 });
    if (saved.created) {
      const site = emailSiteUrl(siteOrigin(req));
      after(async () => {
        await sendRewardMail(saved.order, FEEDBACK_REWARD, site).catch((err) => console.error("feedback reward email failed", err));
        if (answers.rating <= 2) await sendLowRatingAlert(saved.order, answers, site).catch((err) => console.error("low rating alert failed", err));
      });
    }
    return NextResponse.json({ feedback: saved.feedback, rewardOn: await rewardIsOn(FEEDBACK_REWARD.code) });
  } catch (err) {
    if (err instanceof FeedbackError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("feedback failed", err);
    return NextResponse.json({ error: "We couldn't save that. Please try again." }, { status: 500 });
  }
}
