import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
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
      subtitle="We sent a confirmation link via Appwrite. Open it to verify your email, then come back to the vault."
    >
      <div className="flex flex-col gap-4">
        <p className="rounded-2xl border border-[oklch(0.82_0.02_50)] bg-white/70 px-4 py-3 text-sm leading-relaxed text-[oklch(0.45_0.02_50)]">
          If nothing arrives in a minute, check spam — and make sure SMTP /
          Messaging is configured in the Appwrite Console.
        </p>
        <Link
          href="/vault"
          className="inline-flex h-11 items-center justify-center rounded-full bg-[oklch(0.18_0.02_40)] text-sm font-medium text-white hover:bg-[oklch(0.28_0.02_40)]"
        >
          Continue to vault
        </Link>
        <Link
          href="/login"
          className="text-center text-sm text-[oklch(0.45_0.02_50)] underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
