import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Transporter } from "nodemailer";

// Sends email through a Gmail account, using an app password (Google Account →
// Security → 2-Step Verification → App passwords). Free, up to about 500
// emails a day, which is far more than the shop sends.
//
//   GMAIL_USER          the Gmail address that sends, e.g. shop@gmail.com
//   GMAIL_APP_PASSWORD  the 16-letter app password made on that same account
//
// Without them nothing is sent and the site carries on as normal: an order
// never fails because an email couldn't go. For working on the templates,
// MAIL_OUTBOX=<folder> writes each email there as an .html file instead.

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

export const mailConfigured = () => !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

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
    console.info(`email not sent (GMAIL_USER / GMAIL_APP_PASSWORD not set): "${mail.subject}" to ${to.length}`);
    return false;
  }

  try {
    await (await transport()).sendMail({
      from: { name: "Soft Snuggle", address: process.env.GMAIL_USER! },
      to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    return true;
  } catch (err) {
    // Most often a wrong or revoked app password; the message from Gmail says which.
    console.error(`email failed: "${mail.subject}"`, err instanceof Error ? err.message : err);
    return false;
  }
}
