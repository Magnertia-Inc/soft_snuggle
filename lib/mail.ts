import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Transporter } from "nodemailer";
import { STORE } from "./store";

// Sends the shop's email from its Gmail account, one of two ways:
//
// 1. Through the Apps Script relay (scripts/gmail-relay.gs), over HTTPS. This
//    is what the live site uses: Railway's Hobby plan blocks the mail
//    connection (SMTP) that option 2 needs, so Gmail can't be reached directly.
//      MAIL_RELAY_URL     the script's Web app URL (…/exec)
//      MAIL_RELAY_SECRET  the secret its setup() printed
//
// 2. Straight to Gmail over SMTP, with an app password (Google Account →
//    Security → 2-Step Verification → App passwords). Works locally, and on
//    hosts that allow SMTP (Railway Pro).
//      GMAIL_USER          the Gmail address that sends
//      GMAIL_APP_PASSWORD  the 16-letter app password made on that account
//
// The relay wins when both are set. With neither, nothing is sent and the site
// carries on as normal: an order never fails because an email couldn't go.
// For working on the templates, MAIL_OUTBOX=<folder> writes each email there as
// an .html file instead.

export interface Mail {
  to: string[];
  subject: string;
  html: string;
  text: string;
}

const globalForMail = globalThis as unknown as { __softSnuggleMail?: Transporter };

async function transport() {
  if (!globalForMail.__softSnuggleMail) {
    const nodemailer = await import("nodemailer");
    globalForMail.__softSnuggleMail = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "") },
    });
  }
  return globalForMail.__softSnuggleMail;
}

const relayConfigured = () => !!(process.env.MAIL_RELAY_URL && process.env.MAIL_RELAY_SECRET);
const smtpConfigured = () => !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
export const mailConfigured = () => relayConfigured() || smtpConfigured();

async function viaRelay(mail: Mail, to: string[]) {
  const res = await fetch(process.env.MAIL_RELAY_URL!, {
    method: "POST",
    // text/plain keeps Apps Script from rejecting the request before doPost runs.
    headers: { "content-type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret: process.env.MAIL_RELAY_SECRET, to, subject: mail.subject, html: mail.html, text: mail.text, fromName: STORE.name }),
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  const body = await res.text();
  let reply: { ok?: boolean; error?: string; remaining?: number } = {};
  try {
    reply = JSON.parse(body);
  } catch {
    // Apps Script answers with an HTML page when the URL is wrong or the
    // deployment isn't open to "Anyone".
    throw new Error(`the relay didn't answer as expected (HTTP ${res.status}). Check MAIL_RELAY_URL and that the web app is deployed for "Anyone".`);
  }
  if (!reply.ok) throw new Error(`the relay refused: ${reply.error ?? "no reason given"}`);
  return reply.remaining;
}

/** Sends one email. Never throws: a failure is logged and reported as false. */
export async function sendMail(mail: Mail): Promise<boolean> {
  const to = [...new Set(mail.to.map((t) => t.trim()).filter(Boolean))];
  if (!to.length) return false;

  const outbox = process.env.MAIL_OUTBOX;
  if (outbox) {
    const name = `${Date.now()}-${mail.subject.replace(/[^\w-]+/g, "-").slice(0, 60)}.html`;
    await mkdir(outbox, { recursive: true });
    await writeFile(path.join(outbox, name), `<!-- To: ${to.join(", ")} | Subject: ${mail.subject} -->\n${mail.html}`);
    return true;
  }

  if (!mailConfigured()) {
    console.info(`email not sent (no MAIL_RELAY_URL, and no GMAIL_USER / GMAIL_APP_PASSWORD): "${mail.subject}"`);
    return false;
  }

  try {
    if (relayConfigured()) {
      const remaining = await viaRelay(mail, to);
      console.info(`email sent: "${mail.subject}" to ${to.length} (Gmail allows ${remaining ?? "?"} more today)`);
    } else {
      await (await transport()).sendMail({
        from: { name: STORE.name, address: process.env.GMAIL_USER! },
        replyTo: STORE.email,
        to,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
      console.info(`email sent: "${mail.subject}" to ${to.length}`);
    }
    return true;
  } catch (err) {
    // A wrong password or secret, or (over SMTP on Railway Hobby) a connection
    // timeout because SMTP is blocked there.
    console.error(`email failed: "${mail.subject}"`, err instanceof Error ? err.message : err);
    return false;
  }
}
