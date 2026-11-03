import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PhoneStep } from "@/components/account/PhoneStep";
import { readPendingGoogle, safeNext } from "@/lib/customer-google";

export const metadata: Metadata = { title: "One last thing", robots: { index: false } };

/** After a first Google sign-in: the mobile number, asked once. */
export default async function PhoneStepPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const pending = await readPendingGoogle();
  if (!pending) redirect("/login?error=google-expired");
  const next = safeNext((await searchParams).next);

  return (
    <div className="speckle min-h-[80vh]">
      <section className="mx-auto max-w-5xl px-4 pb-24 pt-32 sm:px-6">
        <PhoneStep name={pending.name ?? ""} email={pending.email} next={next} />
      </section>
    </div>
  );
}
