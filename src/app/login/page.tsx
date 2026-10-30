import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Sign in",
  description:
    "Sign in to NoteValut and open your Appwrite-backed note vault session.",
  path: "/login",
});

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to open your NoteValut session."
    >
      <SignInForm />
    </AuthShell>
  );
}
