import { NextResponse } from "next/server";
import { COMMENT_MAX, FeedbackError, rewardIsOn, saveFeedback } from "@/lib/feedback";

/** Saves a customer's rating of their order, from the order page (which knows the order's key). */
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await req.json().catch(() => ({}));
  const key = typeof body.key === "string" ? body.key : "";
  const rating = Number(body.rating);
  const comment = typeof body.comment === "string" ? body.comment : "";
  if (comment.length > COMMENT_MAX * 2) return NextResponse.json({ error: "That's a bit long. Please shorten it." }, { status: 422 });

  try {
    const feedback = await saveFeedback(code, key, rating, comment);
    if (!feedback) return NextResponse.json({ error: "We couldn't find this order." }, { status: 404 });
    return NextResponse.json({ feedback, rewardOn: await rewardIsOn() });
  } catch (err) {
    if (err instanceof FeedbackError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("feedback failed", err);
    return NextResponse.json({ error: "We couldn't save that. Please try again." }, { status: 500 });
  }
}
