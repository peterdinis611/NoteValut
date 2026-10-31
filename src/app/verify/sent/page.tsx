import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";
import { buttonVariants } from "@/components/ui/button";
import { createPageMetadata } from "@/lib/seo";
import { cn } from "cn";
import { authPanelClass } from "@/components/auth/auth-field";

export const metadata: Metadata = createPageMetadata({
  title: "Check your inbox",
  description:
    "We sent a NoteValut confirmation link. Open it to verify your email, then return to the vault.",
  path: "/verify/sent",
  noIndex: true,
});

export default async function VerifySentPage({
  searchParams,
}: {
  searchParams: Promise<{ mail?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const mailFailed = params.mail === "fail";
  const reason = params.reason?.trim();

  return (
    <AuthShell
      title={mailFailed ? "Almost there" : "Check your inbox"}
      subtitle={
        mailFailed
          ? "Your account was created, but Appwrite could not send the confirmation email yet."
          : "We sent a confirmation link. Open it to verify your email, then come back to the vault."
      }
    >
      <div className="flex flex-col gap-4">
        {mailFailed ? (
          <div className="space-y-3">
            <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {reason ||
                "Verification email was not sent. Check Appwrite Auth SMTP / templates, then resend."}
            </p>
            <p className={authPanelClass}>
              In Appwrite Console: add your Sites hostname as a Web platform,
              enable Auth email templates, and confirm SMTP (Cloud default or
              your provider). Then use Resend below.
            </p>
            <ResendVerificationButton />
          </div>
        ) : (
          <p className={authPanelClass}>
            If nothing arrives in a minute, check spam. You can also resend from
            here or from vault settings.
          </p>
        )}

        {!mailFailed ? <ResendVerificationButton /> : null}

        <Link
          href="/vault"
          className={cn(buttonVariants(), "h-11 rounded-full")}
        >
          Continue to vault
        </Link>
        <Link
          href="/login"
          className="text-center text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
