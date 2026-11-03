import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/art/Logo";
import { currentAdmin } from "@/lib/admin";
import { googleConfigured } from "@/lib/google";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  denied: "That Google account isn't on the admin list. Sign in with the shop's account, or ask for yours to be added.",
  cancelled: "Sign-in was cancelled.",
  expired: "That sign-in took too long or was opened in another browser. Please try again.",
  failed: "Google sign-in didn't go through. Please try again.",
  setup: "Google sign-in isn't set up on this server yet (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET).",
};

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentAdmin()) redirect("/admin");
  const { error } = await searchParams;
  const ready = googleConfigured();

  return (
    <div className="speckle flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm rounded-[28px] border border-line bg-paper p-8 text-center shadow-[0_24px_60px_-30px_rgba(38,59,54,0.35)]">
        <Logo className="mx-auto h-10" />
        <p className="eyebrow mt-6">Shop admin</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-ink-soft">Orders, payments, shipping, products and discount codes. Only the shop&apos;s own Google accounts can get in.</p>

        {(error || !ready) && (
          <p role="alert" className="mt-5 rounded-2xl bg-peach/60 px-4 py-3 text-left text-sm">
            {ERRORS[error ?? ""] ?? ERRORS[ready ? "failed" : "setup"]}
          </p>
        )}

        {ready && (
          // A plain link, not fetch: Google's sign-in has to be a full-page visit.
          <a href="/api/admin/auth/google" className="btn-primary mt-6 w-full">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
            </svg>
            Sign in with Google
          </a>
        )}
      </div>
    </div>
  );
}
