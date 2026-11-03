import { cookies } from "next/headers";
import { seal, unseal } from "./auth";
import type { GoogleIdentity } from "./google";

/**
 * Customer "Continue with Google". Google gives us a name and a verified
 * email but never a phone number, and the shop needs one for delivery and
 * WhatsApp. So a first-time Google sign-in is parked in this short-lived
 * cookie until the person types their number on /login/phone, and only then
 * is the account created.
 */
export const GOOGLE_PENDING_COOKIE = "ss_google";
export const OAUTH_SHOP_COOKIE = "ss_oauth_shop";
export const OAUTH_SHOP_PATH = "/api/auth/google";

const THIRTY_MINUTES = 30 * 60;

export interface PendingGoogle {
  sub: string;
  email: string;
  name: string | null;
}

export function pendingGoogleCookie(who: GoogleIdentity) {
  const body = Buffer.from(JSON.stringify({ sub: who.sub, email: who.email, name: who.name })).toString("base64url");
  return {
    name: GOOGLE_PENDING_COOKIE,
    value: seal(`google:${body}.${Date.now() + THIRTY_MINUTES * 1000}`),
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: THIRTY_MINUTES,
    },
  };
}

export async function readPendingGoogle(): Promise<PendingGoogle | null> {
  const match = unseal((await cookies()).get(GOOGLE_PENDING_COOKIE)?.value)?.match(/^google:([\w-]+)\.(\d+)$/);
  if (!match || Number(match[2]) < Date.now()) return null;
  try {
    return JSON.parse(Buffer.from(match[1], "base64url").toString("utf8")) as PendingGoogle;
  } catch {
    return null;
  }
}

/** Where to go after signing in: a path on this site, never another site. */
export function safeNext(raw: string | null | undefined) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw.slice(0, 200) : "/account";
}
