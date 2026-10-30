"use client";

import { useState } from "react";
import { useAppwrite, useUser } from "@appwrite.io/react";
import { Button } from "@/components/ui/button";
import { getEmailVerificationUrl } from "@/lib/appwrite/urls";

export function ResendVerificationButton() {
  const { user } = useUser();
  const { account } = useAppwrite();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user || user.emailVerification) {
    return null;
  }

  const onResend = async () => {
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      await account.createVerification({ url: getEmailVerificationUrl() });
      setMessage("Verification email sent. Check your inbox.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send verification email.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={onResend}
        className="h-8 rounded-full border-border/60 px-3 text-xs"
      >
        {pending ? "Sending…" : "Resend verification email"}
      </Button>
      {message ? (
        <p className="font-mono text-xs text-muted-foreground">{message}</p>
      ) : null}
      {error ? (
        <p className="font-mono text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
