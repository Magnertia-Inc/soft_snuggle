import { NextResponse } from "next/server";
import { normalisePhone, verifyPassword } from "@/lib/auth";
import { findCustomerByPhone, getCustomer, noteLogin } from "@/lib/queries";
import { startSession } from "@/lib/session";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const phone = normalisePhone(typeof body.phone === "string" ? body.phone : "");
  const password = typeof body.password === "string" ? body.password : "";
  // One message for a wrong number and a wrong password, so this cannot be used
  // to find out which mobile numbers have accounts.
  const wrong = () => NextResponse.json({ error: "That number and password don't match." }, { status: 401 });
  if (!phone || !password) return wrong();

  try {
    const row = await findCustomerByPhone(phone);
    // A Google-only account has no password, so the answer is the same "no match".
    if (!row?.password_hash || !(await verifyPassword(password, row.password_hash))) return wrong();

    await noteLogin(row.id);
    await startSession(row.id);
    return NextResponse.json({ customer: await getCustomer(row.id) });
  } catch (err) {
    // Without this the route throws, the browser gets an empty body, and the
    // only thing the person sees is a JSON parse error with no cause in it.
    console.error("login failed", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "We couldn't log you in just now. Please try again.",
        ...(process.env.NODE_ENV === "development" ? { detail } : {}),
      },
      { status: 500 },
    );
  }
}
