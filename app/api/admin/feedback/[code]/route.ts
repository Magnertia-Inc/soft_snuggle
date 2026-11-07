import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { FeedbackError, setFeedbackFollowUp, type FeedbackStatus } from "@/lib/feedback";
import { fromOwnSite } from "@/lib/site";

/** The shop's follow-up on one piece of feedback: its status and a private note. */
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!fromOwnSite(req)) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  const body = await req.json().catch(() => ({}));

  try {
    await setFeedbackFollowUp((await params).code, body.status as FeedbackStatus, typeof body.note === "string" ? body.note : null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof FeedbackError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("feedback follow-up failed", err);
    return NextResponse.json({ error: "That didn't save. Please try again." }, { status: 500 });
  }
}
