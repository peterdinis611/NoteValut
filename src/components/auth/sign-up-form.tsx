"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAppwrite, useAuth } from "@appwrite.io/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getEmailVerificationUrl } from "@/lib/appwrite/urls";
import {
  authHintClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
  authMutedClass,
  authPrimaryButtonClass,
} from "./auth-field";

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
      <p className={authHintClass}>
        {user ? "Already signed in — opening vault…" : "Checking session…"}
      </p>
    );
  }

  if (submittedRef.current && signUp.isPending) {
    return <p className={authHintClass}>Creating account…</p>;
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
        let mail: "ok" | "fail" = "ok";
        let reason = "";
        try {
          await account.createVerification({
            url: getEmailVerificationUrl(),
          });
        } catch (err) {
          mail = "fail";
          reason =
            err instanceof Error
              ? err.message
              : "Appwrite could not send the verification email.";
        }
        const params = new URLSearchParams({ mail });
        if (reason) params.set("reason", reason.slice(0, 240));
        router.replace(`/verify/sent?${params.toString()}`);
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
        <span className={authLabelClass}>Name</span>
        <Input
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Optional"
          className={authInputClass}
        />
      </label>

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
        <span className={authLabelClass}>Password</span>
        <Input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
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
        disabled={signUp.isPending}
        className={authPrimaryButtonClass}
      >
        {signUp.isPending ? "Creating account…" : "Create account"}
      </Button>

      <p className={authMutedClass}>
        Already have a vault?{" "}
        <Link href="/login" className={authLinkClass}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
