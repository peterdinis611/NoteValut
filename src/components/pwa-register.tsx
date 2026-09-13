"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "notevault.pwa-install-dismissed";

/** Registers the offline service worker in production only + install banner. */
export function PwaRegister() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

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

    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (dismissed) return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function handleInstall() {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* user dismissed */
    }
    setDeferred(null);
    setShowBanner(false);
  }

  function handleDismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowBanner(false);
    setDeferred(null);
  }

  if (process.env.NODE_ENV !== "production" || !showBanner) return null;

  return (
    <div className="pwa-install-banner" role="status">
      <div className="pwa-install-copy">
        <Download className="size-4 shrink-0" />
        <span>Install NoteVault for offline access</span>
      </div>
      <div className="pwa-install-actions">
        <button type="button" className="pwa-install-btn" onClick={() => void handleInstall()}>
          Install
        </button>
        <button type="button" className="pwa-install-dismiss" onClick={handleDismiss}>
          Not now
        </button>
        <button
          type="button"
          className="pwa-install-close"
          aria-label="Dismiss"
          onClick={handleDismiss}
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
