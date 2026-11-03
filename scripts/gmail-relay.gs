/**
 * Soft Snuggle email relay — a Google Apps Script that sends the shop's emails
 * from your own Gmail.
 *
 * Why: Railway's Hobby plan blocks the Gmail mail connection (SMTP), so the
 * website can't send email by itself. It can make ordinary web requests, so it
 * sends each email here instead, and this script sends it from the Gmail
 * account it belongs to. Free; Gmail allows about 100 recipients a day.
 *
 * Set up once (signed in to Google as the account that should send, e.g.
 * magnertia@gmail.com):
 *   1. Open https://script.google.com → New project. Name it "Soft Snuggle email".
 *   2. Delete what's in Code.gs and paste this whole file in. Save (Ctrl+S).
 *   3. In the function menu next to "Run", pick setup → Run. Allow access when
 *      Google asks (on "Google hasn't verified this app": Advanced → Go to
 *      Soft Snuggle email). The log at the bottom shows your secret: copy it.
 *   4. Deploy → New deployment → type: Web app.
 *        Execute as: Me    Who has access: Anyone
 *      Deploy, and copy the Web app URL (ends in /exec).
 *   5. In Railway → Soft-snuggle → Variables add:
 *        MAIL_RELAY_URL     = the Web app URL
 *        MAIL_RELAY_SECRET  = the secret from step 3
 *      and apply the change.
 *
 * Run setup again to make a new secret (then update MAIL_RELAY_SECRET). If you
 * change this code, Deploy → Manage deployments → edit → New version, so the
 * same URL keeps working.
 */

function doPost(e) {
  var secret = PropertiesService.getScriptProperties().getProperty("SECRET");
  var mail;
  try {
    mail = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: "not JSON" });
  }
  if (!secret || mail.secret !== secret) return reply({ ok: false, error: "wrong secret" });
  if (!mail.to || !mail.to.length || !mail.subject) return reply({ ok: false, error: "missing to or subject" });

  try {
    MailApp.sendEmail({
      to: mail.to.join(","),
      subject: mail.subject,
      body: mail.text || "",
      htmlBody: mail.html || undefined,
      name: mail.fromName || "Soft Snuggle",
    });
  } catch (err) {
    return reply({ ok: false, error: String(err && err.message ? err.message : err) });
  }
  return reply({ ok: true, remaining: MailApp.getRemainingDailyQuota() });
}

/** Makes the shared secret the website uses to prove a request is really from it. */
function setup() {
  var secret = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
  PropertiesService.getScriptProperties().setProperty("SECRET", secret);
  // Also asks for permission to send email, so the web app works straight away.
  Logger.log("Emails left today: " + MailApp.getRemainingDailyQuota());
  Logger.log("Your secret (put it in Railway as MAIL_RELAY_SECRET): " + secret);
}

function reply(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
