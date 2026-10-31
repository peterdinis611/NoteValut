"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { authPanelClass } from "./auth-field";

export function VerifySentContent() {
  const searchParams = useSearchParams();
  const mailFailed = searchParams.get("mail") === "fail";
  const reason = searchParams.get("reason")?.trim() ?? "";

  return (
    <div className="flex flex-col gap-4">
      {mailFailed ? (
        <div className="space-y-3">
          <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {reason ||
              "Verification email was not sent. Check Appwrite Auth SMTP / templates, then resend."}
          </p>
          <p className={authPanelClass}>
            In Appwrite Console: add your Sites hostname as a Web platform,
            enable Auth email templates, and confirm SMTP (Cloud default or your
            provider). Then use Resend below.
          </p>
          <ResendVerificationButton />
        </div>
      ) : (
        <>
          <p className={authPanelClass}>
            If nothing arrives in a minute, check spam. You can also resend from
            here or from vault settings.
          </p>
          <ResendVerificationButton />
        </>
      )}

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
  );
}
