"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
          className="inline-flex h-11 items-center justify-center rounded-full bg-[oklch(0.18_0.02_40)] text-sm font-medium text-white hover:bg-[oklch(0.28_0.02_40)]"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <p className="font-mono text-sm text-[oklch(0.45_0.02_50)]">
        Password updated — opening sign in…
      </p>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[oklch(0.28_0.02_40)]">
          New password
        </span>
        <Input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="h-11 rounded-full border-[oklch(0.82_0.02_50)] bg-white/80 px-4"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[oklch(0.28_0.02_40)]">
          Confirm password
        </span>
        <Input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat password"
          className="h-11 rounded-full border-[oklch(0.82_0.02_50)] bg-white/80 px-4"
        />
      </label>

      <p className="font-mono text-[11px] tracking-wide text-[oklch(0.55_0.02_50)] uppercase">
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
        className="mt-2 h-11 rounded-full bg-[oklch(0.18_0.02_40)] text-base text-white hover:bg-[oklch(0.28_0.02_40)]"
      >
        {pending ? "Saving…" : "Update password"}
      </Button>

      <p className="mt-2 text-center text-sm text-[oklch(0.45_0.02_50)]">
        <Link
          href="/login"
          className="font-medium text-[oklch(0.22_0.02_40)] underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
