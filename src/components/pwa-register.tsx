"use client";

import { useEffect } from "react";

/** Registers the offline service worker in production (and optionally localhost). */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    // Register in prod always; on local only when explicitly useful for testing
    if (process.env.NODE_ENV !== "production" && !isLocal) return;

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* ignore — SW optional */
    });
  }, []);

  return null;
}
