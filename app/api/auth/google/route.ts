import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { seal } from "@/lib/auth";
import { OAUTH_SHOP_COOKIE, OAUTH_SHOP_PATH, safeNext } from "@/lib/customer-google";
import { googleAuthUrl, googleConfigured } from "@/lib/google";
import { siteOrigin } from "@/lib/site";

const TEN_MINUTES = 10 * 60;

/** "Continue with Google" for shoppers: off to Google's account chooser. */
export async function GET(req: Request) {
  const origin = siteOrigin(req);
  const next = safeNext(new URL(req.url).searchParams.get("next"));
  if (!googleConfigured()) return NextResponse.redirect(`${origin}/login?error=google-setup`);

  // Same protections as the admin sign-in: state ties Google's reply to this
  // browser, nonce ties the ID token to this attempt. next rides along so the
  // shopper lands back where they were (checkout, say).
  const state = randomBytes(16).toString("base64url");
  const nonce = randomBytes(16).toString("base64url");
  const nextB64 = Buffer.from(next).toString("base64url");

  const res = NextResponse.redirect(googleAuthUrl({ redirectUri: `${origin}${OAUTH_SHOP_PATH}/callback`, state, nonce }));
  res.cookies.set(OAUTH_SHOP_COOKIE, seal(`oauth:${state}.${nonce}.${Date.now() + TEN_MINUTES * 1000}.${nextB64}`), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: OAUTH_SHOP_PATH,
    maxAge: TEN_MINUTES,
  });
  return res;
}
