import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, createSession, unseal } from "@/lib/auth";
import { OAUTH_SHOP_COOKIE, OAUTH_SHOP_PATH, pendingGoogleCookie, safeNext } from "@/lib/customer-google";
import { googleIdentity } from "@/lib/google";
import { findCustomerByGoogle, linkGoogle, noteLogin } from "@/lib/queries";
import { currentCustomer, sessionCookieOptions } from "@/lib/session";
import { siteOrigin } from "@/lib/site";

/**
 * Google sends the shopper back here. Three ways it can go:
 * - someone already signed in (with their number) is connecting Google: linked;
 * - this Google account already has an account here: signed in;
 * - otherwise it's their first time: on to /login/phone for their number.
 *
 * An existing account is never matched by email. The email on a number +
 * password account was typed in and never checked, so matching on it would
 * let someone set up an account in another person's name and have it handed
 * to them.
 */
export async function GET(req: Request) {
  const origin = siteOrigin(req);
  const url = new URL(req.url);
  const go = (path: string) => {
    const res = NextResponse.redirect(`${origin}${path}`);
    res.cookies.delete({ name: OAUTH_SHOP_COOKIE, path: OAUTH_SHOP_PATH });
    return res;
  };
  const fail = (error: string) => go(`/login?error=${error}`);

  if (url.searchParams.get("error")) return fail("google-cancelled");

  const saved = unseal((await cookies()).get(OAUTH_SHOP_COOKIE)?.value)?.match(/^oauth:([\w-]+)\.([\w-]+)\.(\d+)\.([\w-]*)$/);
  const code = url.searchParams.get("code");
  if (!saved || !code || saved[1] !== url.searchParams.get("state") || Number(saved[3]) < Date.now()) {
    return fail("google-expired");
  }
  const next = safeNext(Buffer.from(saved[4], "base64url").toString("utf8"));

  try {
    const who = await googleIdentity({ code, redirectUri: `${origin}${OAUTH_SHOP_PATH}/callback`, nonce: saved[2] });
    if (!who.emailVerified) return fail("google-unverified");

    const known = await findCustomerByGoogle(who.sub);
    const signedIn = await currentCustomer();

    if (signedIn) {
      // Connecting Google from the account page. Someone signed in is never
      // switched to a different account: if this Google account belongs to
      // another one, or theirs already has a different Google, nothing changes.
      if (known) return go(known.id === signedIn.id ? next : "/account?google=other");
      if (signedIn.google) return go("/account?google=other");
      return go((await linkGoogle(signedIn.id, who.sub, who.email)) ? "/account?google=linked" : "/account?google=other");
    }

    if (known) {
      await noteLogin(known.id);
      const res = go(next);
      res.cookies.set(SESSION_COOKIE, createSession(known.id), sessionCookieOptions);
      return res;
    }

    const pending = pendingGoogleCookie(who);
    const res = go(`/login/phone?next=${encodeURIComponent(next)}`);
    res.cookies.set(pending.name, pending.value, pending.options);
    return res;
  } catch (err) {
    console.error("google sign-in failed", err);
    return fail("google-failed");
  }
}
