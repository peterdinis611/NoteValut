"use client";

import { useEffect } from "react";

/** Registers the offline service worker in production only. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Dev + Turbopack: SW causes stale chunk errors. Unregister any leftover.
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) void reg.unregister();
      });
      if ("caches" in window) {
        void caches.keys().then((keys) => {
          for (const key of keys) {
            if (key.startsWith("notevault-")) void caches.delete(key);
          }
        });
      }
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* ignore — SW optional */
    });
  }, []);

  return null;
}
