import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { ReviewPieces } from "@/components/feedback/ReviewPieces";
import { cantRateYet, getFeedback, orderForLink, rewardIsOn } from "@/lib/feedback";
import { getOrder } from "@/lib/queries";
import { piecesToReview } from "@/lib/reviews";
import { FEEDBACK_REWARD, REVIEW_REWARD, STORE } from "@/lib/store";
import { whatsappLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your feedback", robots: { index: false } };

// The page the "How was your order?" email links to: the feedback form and a
// review of each piece. The order's key in the link stands in for a login.
export default async function FeedbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ k?: string; r?: string }>;
}) {
  const { code } = await params;
  const { k, r } = await searchParams;
  const order = k ? await getOrder(code, k) : null;
  if (!order) notFound();
  const firstName = order.customerName.split(" ")[0];
  const notYet = cantRateYet(order.status);

  if (notYet) {
    return (
      <div className="speckle min-h-screen">
        <div className="mx-auto max-w-xl px-4 pb-24 pt-32 text-center sm:px-6">
          <h1 className="font-display text-4xl tracking-tight">Hi {firstName}!</h1>
          <p className="mt-3 text-lg text-ink-soft">{notYet}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={`/order/${order.code}?k=${order.accessKey}`} className="btn-primary px-8">See order {order.code}</Link>
            <a href={whatsappLink(`Hi ${STORE.name}! About my order ${order.code}:`)} target="_blank" rel="noreferrer" className="btn-ghost px-8">
              WhatsApp us
            </a>
          </div>
        </div>
      </div>
    );
  }

  const link = (await orderForLink(order.code, order.accessKey))!;
  const [feedback, pieces, fbkOn, rrOn] = await Promise.all([
    getFeedback(order.code, order.accessKey),
    piecesToReview(link.id, order.items),
    rewardIsOn(FEEDBACK_REWARD.code),
    rewardIsOn(REVIEW_REWARD.code),
  ]);
  const start = Math.min(5, Math.max(0, Math.floor(Number(r) || 0)));

  return (
    <div className="speckle min-h-screen">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
        <div className="text-center">
          <p className="eyebrow">Order {order.code}</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
            How was it, <em className="text-sage-deep">{firstName}?</em>
          </h1>
          <p className="mt-3 text-ink-soft">
            {feedback ? "Thanks for your feedback." : "It takes about a minute, and every answer helps us make better little clothes."}
          </p>
        </div>
        <div className="mt-8 space-y-5">
          <FeedbackForm code={order.code} accessKey={order.accessKey} phone={order.phone} initial={feedback} startRating={start} rewardOn={fbkOn} />
          <ReviewPieces code={order.code} accessKey={order.accessKey} phone={order.phone} pieces={pieces} rewardOn={rrOn} />
        </div>
      </div>
    </div>
  );
}
