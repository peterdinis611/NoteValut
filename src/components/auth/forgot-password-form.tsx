"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        <p className="rounded-2xl border border-[oklch(0.82_0.02_50)] bg-white/70 px-4 py-3 text-sm leading-relaxed text-[oklch(0.45_0.02_50)]">
          {doneMessage}
        </p>
        <p className="font-mono text-[11px] tracking-wide text-[oklch(0.55_0.02_50)] uppercase">
          Link expires in 30 minutes · single use
        </p>
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-full bg-[oklch(0.18_0.02_40)] text-sm font-medium text-white hover:bg-[oklch(0.28_0.02_40)]"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[oklch(0.28_0.02_40)]">
          Email
        </span>
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-11 rounded-full border-[oklch(0.82_0.02_50)] bg-white/80 px-4"
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
        className="mt-2 h-11 rounded-full bg-[oklch(0.18_0.02_40)] text-base text-white hover:bg-[oklch(0.28_0.02_40)]"
      >
        {pending ? "Sending…" : "Send reset link"}
      </Button>

      <p className="mt-2 text-center text-sm text-[oklch(0.45_0.02_50)]">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-[oklch(0.22_0.02_40)] underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
