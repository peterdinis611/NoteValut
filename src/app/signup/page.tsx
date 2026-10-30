import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Create account",
  description:
    "Create a NoteValut account with email and password. Typed notes, tags, and an Appwrite session from day one.",
  path: "/signup",
});

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your vault"
      subtitle="Email and password via Appwrite. Your notes stay behind the session."
    >
      <SignUpForm />
    </AuthShell>
  );
}
