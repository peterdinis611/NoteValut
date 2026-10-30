import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Verify email",
  description: "Confirm your NoteValut email address from the Appwrite link.",
  path: "/verify",
  noIndex: true,
});

export default function VerifyPage() {
  return (
    <AuthShell
      title="Confirm email"
      subtitle="We’re finishing email verification from the link Appwrite sent you."
    >
      <Suspense
        fallback={
          <p className="font-mono text-sm text-[oklch(0.45_0.02_50)]">
            Loading verification…
          </p>
        }
      >
        <VerifyEmailForm />
      </Suspense>
    </AuthShell>
  );
}
