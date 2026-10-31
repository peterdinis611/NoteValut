"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "cn";
import {
  authInputClass,
  authLabelClass,
  authLinkClass,
  authMutedClass,
  authPanelClass,
  authPrimaryButtonClass,
} from "./auth-field";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setDoneMessage(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error || "Could not send reset email.");
        return;
      }

      setDoneMessage(
        data.message ||
          "If an account exists for that email, a reset link is on its way.",
      );
    } catch {
      setError("Network error. Try again in a moment.");
    } finally {
      setPending(false);
    }
  };

  if (doneMessage) {
    return (
      <div className="flex flex-col gap-4">
        <p className={authPanelClass}>{doneMessage}</p>
        <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Link expires in 30 minutes · single use
        </p>
        <Link
          href="/login"
          className={cn(buttonVariants(), "h-11 rounded-full")}
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className={authLabelClass}>Email</span>
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={authInputClass}
        />
      </label>

      {error ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className={authPrimaryButtonClass}
      >
        {pending ? "Sending…" : "Send reset link"}
      </Button>

      <p className={authMutedClass}>
        Remembered it?{" "}
        <Link href="/login" className={authLinkClass}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
