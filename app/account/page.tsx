import type { Metadata } from "next";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import { googleConfigured } from "@/lib/google";

export const metadata: Metadata = { title: "Your account" };

const NOTICES: Record<string, string> = {
  linked: "Google is connected. Next time, Continue with Google opens this account.",
  other: "That Google account is already connected to another account here, so nothing was changed.",
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  const { google } = await searchParams;
  return (
    <div className="speckle min-h-[80vh]">
      <section className="mx-auto max-w-3xl px-4 pb-24 pt-32 sm:px-6">
        <AccountDashboard google={googleConfigured()} notice={google ? NOTICES[google] ?? null : null} />
      </section>
    </div>
  );
}
