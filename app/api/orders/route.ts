import { NextResponse, after } from "next/server";
import { emailSiteUrl, sendOrderEmails } from "@/lib/order-emails";
import { OrderError, createOrder, getOrder, saveCustomerAddress } from "@/lib/queries";
import { siteOrigin } from "@/lib/site";
import { currentCustomer } from "@/lib/session";

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const customerName = str(body.customerName, 80);
  const phone = str(body.phone, 20).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  const email = str(body.email, 120) || null;
  const address = str(body.address, 400);
  const city = str(body.city, 80);
  const state = str(body.state, 80);
  const pincode = str(body.pincode, 10);
  const paymentMethod = body.paymentMethod === "cod" ? "cod" : body.paymentMethod === "upi" ? "upi" : null;
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const couponCode = str(body.couponCode, 40) || null;

  const errors: string[] = [];
  if (customerName.length < 2) errors.push("Please enter your name.");
  if (!/^[6-9]\d{9}$/.test(phone)) errors.push("Please enter a valid 10-digit mobile number.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Please check your email address.");
  if (address.length < 8) errors.push("Please enter your full address.");
  if (!city) errors.push("Please enter your city.");
  if (!state) errors.push("Please enter your state.");
  if (!/^[1-9]\d{5}$/.test(pincode)) errors.push("Please enter a valid 6-digit pincode.");
  if (!paymentMethod) errors.push("Please choose a payment method.");

  const items = rawItems
    .slice(0, 30)
    .map((i) => i as Record<string, unknown>)
    .map((i) => ({
      productId: Number(i.productId),
      size: str(i.size, 20),
      colour: str(i.colour, 40) || undefined,
      qty: Math.floor(Number(i.qty)),
    }))
    .filter((i) => Number.isInteger(i.productId) && i.size && i.qty >= 1 && i.qty <= 10);
  if (items.length === 0) errors.push("Your bag is empty.");

  if (errors.length) return NextResponse.json({ error: errors[0], errors }, { status: 422 });

  try {
    // Guests order without an account; when someone is signed in the order is
    // filed under them and their address is kept for next time.
    const customer = await currentCustomer();
    const order = await createOrder({
      customerName, phone, email, address, city, state, pincode,
      paymentMethod: paymentMethod!, items, customerId: customer?.id ?? null, couponCode,
    });
    if (customer) {
      await saveCustomerAddress(customer.id, { name: customerName, email, address, city, state, pincode });
    }
    // Cash on delivery is emailed straight away. A UPI order waits until the
    // customer enters their UTR (app/api/orders/[code]/utr).
    if (paymentMethod === "cod") {
      const site = emailSiteUrl(siteOrigin(req));
      after(async () => {
        const placed = await getOrder(order.code, order.accessKey);
        if (placed) await sendOrderEmails(placed, "cod_placed", site);
      });
    }
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("createOrder failed", err);
    return NextResponse.json({ error: "We couldn't place your order. Please try again." }, { status: 500 });
  }
}
