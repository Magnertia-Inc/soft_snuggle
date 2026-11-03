import { NextResponse } from "next/server";
import { normalisePhone } from "@/lib/auth";
import { GOOGLE_PENDING_COOKIE, readPendingGoogle } from "@/lib/customer-google";
import { AuthError, createCustomer, findCustomerByGoogle, noteLogin } from "@/lib/queries";
import { startSession } from "@/lib/session";
import { fromOwnSite } from "@/lib/site";

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** First Google sign-in, second half: the mobile number Google doesn't give us. */
export async function POST(req: Request) {
  if (!fromOwnSite(req)) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const pending = await readPendingGoogle();
  if (!pending) {
    return NextResponse.json(
      { error: "Your Google sign-in timed out. Please press Continue with Google again.", expired: true },
      { status: 401 },
    );
  }

  const name = str(body.name, 80);
  const phone = normalisePhone(str(body.phone, 20));
  if (name.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 422 });
  if (!phone) return NextResponse.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 422 });

  try {
    // Pressed twice, or a second tab got there first.
    const already = await findCustomerByGoogle(pending.sub);
    const customer =
      already ?? (await createCustomer({ phone, name, email: pending.email, passwordHash: null, googleSub: pending.sub }));
    if (already) await noteLogin(already.id);
    await startSession(customer.id);
    const res = NextResponse.json({ customer }, { status: already ? 200 : 201 });
    res.cookies.delete(GOOGLE_PENDING_COOKIE);
    return res;
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        {
          error:
            "This number already has an account. Log in with your number and password, then press Connect Google on your account page.",
        },
        { status: 409 },
      );
    }
    console.error("google sign-up failed", err);
    return NextResponse.json({ error: "We couldn't create your account. Please try again." }, { status: 500 });
  }
}
