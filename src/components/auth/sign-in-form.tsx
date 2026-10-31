"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@appwrite.io/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  authHintClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
  authMutedClass,
  authPrimaryButtonClass,
} from "./auth-field";

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
      <p className={authHintClass}>
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

      <label className="flex flex-col gap-1.5">
        <span className={`flex items-center justify-between gap-2 ${authLabelClass}`}>
          Password
          <Link
            href="/forgot-password"
            className="font-normal text-muted-foreground underline-offset-2 hover:underline"
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
          className={authInputClass}
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
        className={authPrimaryButtonClass}
      >
        {signIn.isPending ? "Signing in…" : "Sign in"}
      </Button>

      <p className={authMutedClass}>
        New here?{" "}
        <Link href="/signup" className={authLinkClass}>
          Create an account
        </Link>
      </p>
    </form>
  );
}
