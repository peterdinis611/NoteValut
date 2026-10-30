import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Reset password",
  description:
    "Choose a new NoteValut password using your 30-minute reset link.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      subtitle="This link works once and expires 30 minutes after it was sent."
    >
      <Suspense
        fallback={
          <p className="font-mono text-sm text-[oklch(0.45_0.02_50)]">
            Loading reset form…
          </p>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
