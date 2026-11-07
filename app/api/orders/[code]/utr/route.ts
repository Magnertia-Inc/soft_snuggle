import { NextResponse, after } from "next/server";
import { emailSiteUrl, sendOrderEmails } from "@/lib/order-emails";
import { getOrder, submitUtr } from "@/lib/queries";
import { siteOrigin } from "@/lib/site";

const UTR_HELP = "The UTR is the 12-digit number in your UPI app (UPI Ref No.). Please enter all 12 digits.";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await req.json().catch(() => ({}));
  const key = typeof body.key === "string" ? body.key : "";
  const utr = typeof body.utr === "string" ? body.utr.replace(/\s/g, "") : "";

  // A UPI reference (UTR) is always exactly 12 digits.
  if (!/^\d{12}$/.test(utr)) {
    return NextResponse.json({ error: UTR_HELP }, { status: 422 });
  }
  const saved = await submitUtr(code, key, utr);
  if (!saved) {
    return NextResponse.json(
      { error: "We couldn't update this order. It may already be confirmed — message us on WhatsApp if you need help." },
      { status: 404 },
    );
  }

  // A UPI order is only emailed about once the customer says they've paid.
  // Sending the same UTR twice (a double tap) emails nobody.
  if (saved.previousUtr !== utr) {
    const site = emailSiteUrl(siteOrigin(req));
    after(async () => {
      const order = await getOrder(code, key);
      if (order) await sendOrderEmails(order, saved.previousUtr ? "utr_changed" : "utr_submitted", site);
    });
  }
  return NextResponse.json({ ok: true, utr });
}
