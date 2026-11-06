import { NextResponse } from "next/server";
import { addSubscriber } from "@/lib/queries";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 120) : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 422 });
  }
  await addSubscriber(email);
  return NextResponse.json({ ok: true });
}
