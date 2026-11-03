import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/account/AuthForm";
import { googleConfigured } from "@/lib/google";

export const metadata: Metadata = { title: "Log in" };

const ERRORS: Record<string, string> = {
  "google-cancelled": "Google sign-in was cancelled.",
  "google-expired": "That sign-in took too long or was opened in another browser. Please try again.",
  "google-unverified": "Google hasn't verified that email address yet. Please use another account, or log in with your number.",
  "google-failed": "Google sign-in didn't go through. Please try again.",
  "google-setup": "Google sign-in isn't switched on yet. Please log in with your number for now.",
};

// Read per request, not at build: whether Google is set up can change without a rebuild.
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="speckle min-h-[80vh]">
      <section className="mx-auto max-w-5xl px-4 pb-24 pt-32 sm:px-6">
        <Suspense fallback={null}>
          <AuthForm google={googleConfigured()} notice={error ? ERRORS[error] ?? null : null} />
        </Suspense>
      </section>
    </div>
  );
}
