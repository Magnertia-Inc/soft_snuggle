import { NextResponse } from "next/server";
import { activeWelcomeCode, sendWelcome } from "@/lib/newsletter";
import { emailSiteUrl } from "@/lib/order-emails";
import { addSubscriber } from "@/lib/queries";
import { siteOrigin } from "@/lib/site";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 120) : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 422 });
  }
  const isNew = await addSubscriber(email);
  const code = await activeWelcomeCode();
  // One welcome email per address: signing up again doesn't send another,
  // so the form can't be used to flood someone's inbox.
  const emailed = isNew ? await sendWelcome(email, emailSiteUrl(siteOrigin(req)), code) : false;
  return NextResponse.json({ ok: true, code, emailed });
}
