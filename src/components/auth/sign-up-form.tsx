"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAppwrite, useAuth } from "@appwrite.io/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getEmailVerificationUrl } from "@/lib/appwrite/urls";

export function SignUpForm() {
  const router = useRouter();
  const { account } = useAppwrite();
  const { user, isLoading, signUp, error } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    // Only bounce existing sessions — after signup we go to /verify/sent.
    if (!isLoading && user && !submittedRef.current) {
      router.replace("/vault");
    }
  }, [isLoading, user, router]);

  if (isLoading || (user && !submittedRef.current)) {
    return (
      <p className="font-mono text-sm text-[oklch(0.45_0.02_50)]">
        {user ? "Already signed in — opening vault…" : "Checking session…"}
      </p>
    );
  }

  if (submittedRef.current && signUp.isPending) {
    return (
      <p className="font-mono text-sm text-[oklch(0.45_0.02_50)]">
        Creating account…
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

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }

    submittedRef.current = true;

    signUp.emailPassword({
      email: email.trim(),
      password,
      name: name.trim() || undefined,
      onSuccess: async () => {
        try {
          await account.createVerification({
            url: getEmailVerificationUrl(),
          });
        } catch {
          // Account exists even if mail fails — user can resend from vault.
        }
        router.replace("/verify/sent");
        router.refresh();
      },
      onError: (err) => {
        submittedRef.current = false;
        setLocalError(err.message || "Could not create account.");
      },
    });
  };

  const message = localError || error?.message;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[oklch(0.28_0.02_40)]">
          Name
        </span>
        <Input
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Optional"
          className="h-11 rounded-full border-[oklch(0.82_0.02_50)] bg-white/80 px-4"
        />
      </label>

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
        <span className="text-sm font-medium text-[oklch(0.28_0.02_40)]">
          Password
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

      {message ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={signUp.isPending}
        className="mt-2 h-11 rounded-full bg-[oklch(0.18_0.02_40)] text-base text-white hover:bg-[oklch(0.28_0.02_40)]"
      >
        {signUp.isPending ? "Creating account…" : "Create account"}
      </Button>

      <p className="mt-2 text-center text-sm text-[oklch(0.45_0.02_50)]">
        Already have a vault?{" "}
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
