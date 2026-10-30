"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppwrite } from "@appwrite.io/react";

type Status = "idle" | "verifying" | "success" | "error";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { account } = useAppwrite();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  useEffect(() => {
    if (!userId || !secret) {
      setStatus("error");
      setMessage("Missing verification link. Open the link from your email.");
      return;
    }

    let cancelled = false;

    const run = async () => {
      setStatus("verifying");
      try {
        await account.updateVerification({ userId, secret });
        if (cancelled) return;
        setStatus("success");
        setMessage("Email confirmed. Opening your vault…");
        router.replace("/vault");
        router.refresh();
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not verify this email link.",
        );
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [account, router, secret, userId]);

  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-sm text-[oklch(0.45_0.02_50)]">
        {status === "verifying" || status === "idle"
          ? "Confirming your email…"
          : message}
      </p>

      {status === "error" ? (
        <div className="flex flex-col gap-3">
          <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {message}
          </p>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[oklch(0.18_0.02_40)] text-sm font-medium text-white hover:bg-[oklch(0.28_0.02_40)]"
          >
            Back to sign in
          </Link>
        </div>
      ) : null}
    </div>
  );
}
