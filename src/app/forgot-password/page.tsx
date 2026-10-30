import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Forgot password",
  description:
    "Request a NoteValut password reset link. Links expire after 30 minutes.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      subtitle="We’ll email a one-time link that expires in 30 minutes."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
