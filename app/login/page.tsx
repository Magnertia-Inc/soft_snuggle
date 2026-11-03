import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/account/AuthForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="speckle min-h-[80vh]">
      <section className="mx-auto max-w-5xl px-4 pb-24 pt-32 sm:px-6">
        <Suspense fallback={null}>
          <AuthForm />
        </Suspense>
      </section>
    </div>
  );
}
