import { getDb } from "./db";
import { sendMail } from "./mail";
import { button, esc, layout } from "./order-emails";
import { STORE } from "./store";

// The newsletter sign-up on the home page. Each new address gets one welcome
// email carrying the WELCOME10 code (10% off, once per phone number), which is
// a normal code the owner can edit or switch off in Admin -> Coupons. While it
// is switched off, sign-ups still work but neither the email nor the page
// mentions a code.

export const WELCOME_CODE = "WELCOME10";

/** The welcome code when it can currently be used, else null. */
export async function activeWelcomeCode(): Promise<string | null> {
  const db = await getDb();
  const { rows } = await db.query<{ code: string }>(
    "SELECT code FROM coupons WHERE code = $1 AND active AND (expires_at IS NULL OR expires_at > now()) AND (max_uses IS NULL OR used_count < max_uses)",
    [WELCOME_CODE],
  );
  return rows[0]?.code ?? null;
}

/** Sends the welcome email once and notes when it went. Never throws. */
export async function sendWelcome(email: string, siteUrl: string, code: string | null) {
  const shop = `${siteUrl.replace(/\/+$/, "")}/shop`;
  const codeBlock = code
    ? `<p style="margin:0 0 8px">As promised, here's 10% off your first order:</p>
<p style="margin:0 0 8px;display:inline-block;border:2px dashed #263B36;border-radius:12px;padding:10px 18px;font-size:22px;font-weight:bold;letter-spacing:3px">${esc(code)}</p>
<p style="margin:0;color:#5E6F69;font-size:13px">Type it in the discount code box at checkout. It works once per mobile number.</p>`
    : "";
  const html = layout(
    "You're on the list 💌",
    `<p style="margin:0 0 16px">Thank you for joining ${esc(STORE.name)}. We'll write now and then with new little things and thoughtful tips, never more than that.</p>
${codeBlock}
${button(shop, "Browse the shop")}`,
  );
  const text = [
    `Thank you for joining ${STORE.name}. We'll write now and then with new little things and thoughtful tips.`,
    code ? `\nAs promised, here's 10% off your first order: ${code}\nType it in the discount code box at checkout. It works once per mobile number.` : "",
    `\nBrowse the shop: ${shop}`,
  ].join("\n");

  const sent = await sendMail({ to: [email], subject: `Welcome to ${STORE.name}`, html, text });
  if (sent) {
    const db = await getDb();
    await db.query("UPDATE subscribers SET welcomed_at = now() WHERE email = $1", [email]).catch(() => {});
  }
  return sent;
}

export interface Subscriber {
  email: string;
  createdAt: string;
  welcomedAt: string | null;
}

/** Everyone who signed up, newest first, for the admin panel. */
export async function listSubscribers(): Promise<Subscriber[]> {
  const db = await getDb();
  const { rows } = await db.query<{ email: string; created_at: Date | string; welcomed_at: Date | string | null }>(
    "SELECT email, created_at, welcomed_at FROM subscribers ORDER BY created_at DESC",
  );
  return rows.map((r) => ({
    email: r.email,
    createdAt: new Date(r.created_at).toISOString(),
    welcomedAt: r.welcomed_at ? new Date(r.welcomed_at).toISOString() : null,
  }));
}
