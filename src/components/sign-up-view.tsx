"use client";

import { SignUp, useClerk } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { clerkAppearance } from "@/lib/clerk-appearance";

function wipeClerkStorage() {
  try {
    for (const store of [window.localStorage, window.sessionStorage]) {
      const keys = Object.keys(store);
      for (const key of keys) {
        if (key.toLowerCase().includes("clerk")) store.removeItem(key);
      }
    }
  } catch {
    /* ignore */
  }
}

export function SignUpView() {
  const clerk = useClerk();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("reset") && !params.has("fresh")) return;
    ran.current = true;

    void (async () => {
      wipeClerkStorage();
      try {
        await clerk.signOut();
      } catch {
        /* ignore */
      }
      window.location.replace("/sign-up");
    })();
  }, [clerk]);

  return (
    <SignUp
      appearance={clerkAppearance}
      forceRedirectUrl="/"
      signInUrl="/sign-in"
    />
  );
}
