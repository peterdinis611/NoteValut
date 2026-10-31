import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifySentContent } from "@/components/auth/verify-sent-content";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Check your inbox",
  description:
    "We sent a NoteValut confirmation link. Open it to verify your email, then return to the vault.",
  path: "/verify/sent",
  noIndex: true,
});

export default function VerifySentPage() {
  return (
    <AuthShell
      title="Check your inbox"
      subtitle="Confirm your email from the link Appwrite sent — or resend if it never arrived."
    >
      <Suspense
        fallback={
          <p className="font-mono text-sm text-muted-foreground">
            Loading…
          </p>
        }
      >
        <VerifySentContent />
      </Suspense>
    </AuthShell>
  );
}
