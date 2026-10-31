"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "cn";
import {
  authHintClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
  authMutedClass,
  authPrimaryButtonClass,
} from "./auth-field";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const secret = searchParams.get("secret") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const linkMissing = !userId || !secret;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (linkMissing) {
      setError("This reset link is incomplete. Request a new one.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, secret, password }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error || "Could not reset password.");
        return;
      }

      setDone(true);
      window.setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 1600);
    } catch {
      setError("Network error. Try again in a moment.");
    } finally {
      setPending(false);
    }
  };

  if (linkMissing) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Missing reset link. Open the link from your email, or request a new
          one. Links expire after 30 minutes.
        </p>
        <Link
          href="/forgot-password"
          className={cn(buttonVariants(), "h-11 rounded-full")}
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return <p className={authHintClass}>Password updated — opening sign in…</p>;
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className={authLabelClass}>New password</span>
        <Input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className={authInputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={authLabelClass}>Confirm password</span>
        <Input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat password"
          className={authInputClass}
        />
      </label>

      <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
        This link expires 30 minutes after it was sent
      </p>

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
        {pending ? "Saving…" : "Update password"}
      </Button>

      <p className={authMutedClass}>
        <Link href="/login" className={authLinkClass}>
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
