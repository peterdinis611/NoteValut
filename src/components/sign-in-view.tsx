"use client";

import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";

export function SignInView() {
  return (
    <SignIn
      appearance={clerkAppearance}
      forceRedirectUrl="/"
      signUpUrl="/sign-up"
    />
  );
}
