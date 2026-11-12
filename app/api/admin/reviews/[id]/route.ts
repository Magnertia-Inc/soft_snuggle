import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { FeedbackError } from "@/lib/feedback";
import { setReviewStatus, type ReviewStatus } from "@/lib/reviews";
import { fromOwnSite } from "@/lib/site";

/** Approves a review (it shows on the product page), hides it, or puts it back to waiting. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!fromOwnSite(req)) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const body = await req.json().catch(() => ({}));

  try {
    await setReviewStatus(id, body.status as ReviewStatus);
    console.info(`review ${id} set to ${body.status} by ${admin.email}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof FeedbackError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("review update failed", err);
    return NextResponse.json({ error: "That didn't save. Please try again." }, { status: 500 });
  }
}
