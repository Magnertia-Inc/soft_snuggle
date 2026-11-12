import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { OrderFlow } from "@/components/checkout/OrderFlow";
import { getFeedback } from "@/lib/feedback";
import { getOrder } from "@/lib/queries";
import { STORE } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { code } = await params;
  const { k } = await searchParams;
  const order = k ? await getOrder(code, k) : null;
  if (!order) notFound();
  const feedbackGiven = order.status === "delivered" && !!(await getFeedback(order.code, order.accessKey));

  const upiId = process.env.UPI_ID || "softsnuggle@okaxis";
  const payee = process.env.UPI_PAYEE_NAME || STORE.name;
  const upiUrl =
    `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payee)}` +
    `&am=${order.total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${order.code}`)}&tr=${order.code}`;
  const qrSvg = await QRCode.toString(upiUrl, {
    type: "svg",
    margin: 1,
    color: { dark: "#263B36", light: "#FDFBF6" },
  });

  return (
    <div className="speckle min-h-screen">
      <OrderFlow order={order} upiUrl={upiUrl} upiId={upiId} payee={payee} qrSvg={qrSvg} feedbackGiven={feedbackGiven} />
    </div>
  );
}
