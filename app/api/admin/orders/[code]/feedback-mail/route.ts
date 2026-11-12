import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { sendFeedbackInvite } from "@/lib/feedback-mail";
import { emailSiteUrl } from "@/lib/order-emails";
import { fromOwnSite, siteOrigin } from "@/lib/site";

const MESSAGES = {
  no_email: "This customer didn't give an email address. Send the link on WhatsApp instead.",
  not_delivered: "Mark the order delivered first.",
  rated: "The customer has already given feedback.",
  failed: "The email didn't go. Please try again in a minute.",
  not_found: "That order no longer exists.",
} as const;

/** Emails the customer their feedback link now, rather than waiting for the timer. */
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!fromOwnSite(req)) return NextResponse.json({ error: "Invalid request." }, { status: 403 });

  const result = await sendFeedbackInvite((await params).code, emailSiteUrl(siteOrigin(req)), admin.email);
  if (result === "sent") return NextResponse.json({ ok: true });
  return NextResponse.json({ error: MESSAGES[result] }, { status: result === "failed" ? 502 : 409 });
}
