"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ROUTES = ["/vault", "/demo", "/login", "/signup", "/forgot-password"] as const;

/** Warm the App Router cache for common destinations after first paint. */
export function RoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;

    const run = () => {
      if (cancelled) return;
      for (const href of ROUTES) {
        router.prefetch(href);
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(run, { timeout: 1500 });
    } else {
      timeoutId = setTimeout(run, 250);
    }

    return () => {
      cancelled = true;
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [router]);

  return null;
}
