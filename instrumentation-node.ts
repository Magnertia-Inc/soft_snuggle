/** Server-start work that needs Node (see instrumentation.ts). */
export async function registerNode() {
  // The "How was your order?" emails go out on a timer (lib/feedback-mail.ts).
  // Never let it stop the server starting.
  try {
    const { startFeedbackMailer } = await import("./lib/feedback-mail");
    startFeedbackMailer();
  } catch (err) {
    console.error("feedback email timer failed to start", err);
  }
  if (process.env.DATABASE_URL) return;
  // Hosted deploys refuse the embedded database (see lib/db.ts), so there is nothing to warm up.
  if (process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT) return;
  try {
    const { getPglite } = await import("./lib/pglite");
    await getPglite();
  } catch (err) {
    // Not fatal: the first request opens it instead, as it did before.
    console.error("database warm-up failed", err);
  }
}
