import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STORE, inr, shippingIsFree, whatsappDisplay } from "@/lib/store";

// Draft copy. Replace with the client's approved wording before launch.
const POLICIES: Record<string, { title: string; sections: [string, string][] }> = {
  shipping: {
    title: "Shipping",
    sections: [
      ["Where we ship", "We deliver across India through our courier partners."],
      [
        "Charges",
        shippingIsFree
          ? "Delivery is free on every order, whatever it comes to. No minimum."
          : `Free shipping on orders over ${inr(STORE.freeShippingAbove)}. Below that, a flat ${inr(STORE.shippingFlat)} applies.`,
      ],
      ["Dispatch & delivery", "Orders are packed and dispatched within 1–2 working days after confirmation on WhatsApp. Delivery usually takes 3–7 working days depending on your pincode."],
      ["Cash on Delivery", "COD is available on most pincodes. Please keep the exact amount ready when your parcel arrives."],
      ["Tracking your order", "Once your parcel ships, we share the courier name and tracking number on WhatsApp. You can also see every step anytime on the Track order page with your order ID and mobile number."],
      ["Ordering hours", "You can place orders anytime, 24×7. Orders placed on Sundays or holidays are packed on the next working day."],
    ],
  },
  returns: {
    title: "Returns & exchanges",
    sections: [
      ["Size exchanges", "Little ones grow fast! If the size isn't right, message us on WhatsApp within 7 days of delivery and we'll arrange an exchange."],
      ["Condition", "Items must be unworn and unwashed, with tags attached and in their original packaging."],
      ["Damaged or wrong item", "If something arrives damaged or isn't what you ordered, send us a photo on WhatsApp within 48 hours and we'll make it right."],
      ["Refunds", "Refunds for prepaid orders go back to the original UPI account within 5–7 working days of us receiving the return."],
      ["Cancellations", "Orders can be cancelled before they are dispatched. Just message us on WhatsApp with your order number."],
    ],
  },
  privacy: {
    title: "Privacy",
    sections: [
      ["What we collect", "Your name, phone number, delivery address, optional email, and the details of your order."],
      ["How we use it", "Only to process, deliver and support your order: if you give an email, we send your order confirmation there. If you sign up for news, we send occasional emails. We never sell your data."],
      ["Payments", "UPI payments happen inside your own UPI app. We never see or store your bank or card details."],
      ["Contact", `Questions about your data? Message us on WhatsApp at ${whatsappDisplay}.`],
    ],
  },
  terms: {
    title: "Terms",
    sections: [
      ["Orders", "An order is confirmed once we acknowledge it on WhatsApp. For UPI orders, this happens after we've matched your payment."],
      ["Pricing", "All prices are in Indian Rupees and include applicable taxes. Prices may change without notice, but never after your order is placed."],
      ["Product colours", "We do our best to show colours accurately, but they may vary slightly between screens."],
    ],
  },
};

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = POLICIES[(await params).slug];
  return p ? { title: p.title } : {};
}

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export default async function PolicyPage({ params }: Params) {
  const policy = POLICIES[(await params).slug];
  if (!policy) notFound();
  return (
    <article className="speckle min-h-screen">
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-32 sm:pt-40">
        <p className="eyebrow">Policies</p>
        <h1 className="mt-3 font-display text-5xl tracking-tight sm:text-6xl">{policy.title}</h1>
        <div className="mt-10 space-y-8">
          {policy.sections.map(([h, body]) => (
            <section key={h} className="rounded-[24px] bg-paper p-6 sm:p-8">
              <h2 className="font-display text-2xl">{h}</h2>
              <p className="mt-2 leading-relaxed text-ink-soft">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
