/**
 * "Sign in with Google" (OpenID Connect, authorization code flow) without a
 * library. Used by the admin panel and by shoppers' "Continue with Google".
 *
 * Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from a Google Cloud OAuth
 * client (type "Web application"). Its authorised redirect URIs must list
 * every callback address exactly, e.g.
 *   https://soft-snuggle-production.up.railway.app/api/admin/auth/google/callback
 *   https://soft-snuggle-production.up.railway.app/api/auth/google/callback
 *   http://localhost:3000/api/admin/auth/google/callback
 *   http://localhost:3000/api/auth/google/callback
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ISSUERS = ["accounts.google.com", "https://accounts.google.com"];

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleAuthUrl({ redirectUri, state, nonce }: { redirectUri: string; state: string; nonce: string }) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    // Always show the account chooser, so someone signed in to a personal
    // Google account can pick the shop's one instead of being refused.
    prompt: "select_account",
  });
  return `${AUTH_URL}?${params}`;
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
}

export class GoogleAuthError extends Error {}

/**
 * Trades the code Google sent back for the person's identity.
 *
 * The ID token comes straight from Google's token endpoint over HTTPS, in
 * return for our client secret, so OpenID Connect (Core §3.1.3.7) does not
 * require checking its signature. Its claims are still checked: it must be
 * for this app, from Google, unexpired, and carry the nonce we sent.
 */
export async function googleIdentity({ code, redirectUri, nonce }: { code: string; redirectUri: string; nonce: string }): Promise<GoogleIdentity> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new GoogleAuthError(`Google token exchange failed (${res.status}): ${await res.text()}`);

  const { id_token: idToken } = (await res.json()) as { id_token?: string };
  const payload = idToken?.split(".")[1];
  if (!payload) throw new GoogleAuthError("Google sent no ID token.");
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;

  if (claims.aud !== process.env.GOOGLE_CLIENT_ID) throw new GoogleAuthError("ID token is for another app.");
  if (!ISSUERS.includes(String(claims.iss))) throw new GoogleAuthError("ID token is not from Google.");
  if (typeof claims.exp !== "number" || claims.exp * 1000 < Date.now()) throw new GoogleAuthError("ID token has expired.");
  if (claims.nonce !== nonce) throw new GoogleAuthError("ID token nonce does not match.");
  if (typeof claims.sub !== "string" || typeof claims.email !== "string") throw new GoogleAuthError("ID token has no email.");

  return {
    sub: claims.sub,
    email: claims.email.toLowerCase(),
    emailVerified: claims.email_verified === true,
    name: typeof claims.name === "string" ? claims.name : null,
  };
}
