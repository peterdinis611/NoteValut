import Link from "next/link";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getSessionAccount } from "@/domain/account";
import { runServer } from "@/lib/effect-server";

/** Server component: reads Appwrite session via Effect. */
export async function SessionStatus() {
  const account = await runServer(getSessionAccount());

  if (!account) {
    return (
      <p className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 font-mono text-xs text-muted-foreground">
        Appwrite session: signed out ·{" "}
        <Link
          href="/login"
          className="text-primary underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
        {" · "}
        <Link
          href="/signup"
          className="text-primary underline-offset-2 hover:underline"
        >
          Create account
        </Link>
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 font-mono text-xs text-muted-foreground">
        Appwrite session:{" "}
        <span className="text-foreground">
          {account.name || account.email || account.id}
        </span>
      </p>
      <ResendVerificationButton />
      <SignOutButton className="h-8 rounded-full border-border/60 px-3 text-xs" />
    </div>
  );
}
