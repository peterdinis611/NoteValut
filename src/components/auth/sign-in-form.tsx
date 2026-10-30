"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@appwrite.io/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignInForm() {
  const router = useRouter();
  const { user, isLoading, signIn, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/vault");
    }
  }, [isLoading, user, router]);

  if (isLoading || user) {
    return (
      <p className="font-mono text-sm text-[oklch(0.45_0.02_50)]">
        {user ? "Already signed in — opening vault…" : "Checking session…"}
      </p>
    );
  }

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError("Email and password are required.");
      return;
    }

    signIn.emailPassword({
      email: email.trim(),
      password,
      onSuccess: () => {
        router.replace("/vault");
        router.refresh();
      },
      onError: (err) => {
        setLocalError(err.message || "Could not sign in.");
      },
    });
  };

  const message = localError || error?.message;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
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

      <label className="flex flex-col gap-1.5">
        <span className="flex items-center justify-between gap-2 text-sm font-medium text-[oklch(0.28_0.02_40)]">
          Password
          <Link
            href="/forgot-password"
            className="font-normal text-[oklch(0.45_0.02_50)] underline-offset-2 hover:underline"
          >
            Forgot password?
          </Link>
        </span>
        <Input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="h-11 rounded-full border-[oklch(0.82_0.02_50)] bg-white/80 px-4"
        />
      </label>

      {message ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={signIn.isPending}
        className="mt-2 h-11 rounded-full bg-[oklch(0.18_0.02_40)] text-base text-white hover:bg-[oklch(0.28_0.02_40)]"
      >
        {signIn.isPending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="mt-2 text-center text-sm text-[oklch(0.45_0.02_50)]">
        New here?{" "}
        <Link
          href="/signup"
          className="font-medium text-[oklch(0.22_0.02_40)] underline-offset-2 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
