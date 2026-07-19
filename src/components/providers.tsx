"use client";

import { useAuth } from "@clerk/nextjs";
import { PacerProvider } from "@tanstack/react-pacer";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode, useMemo } from "react";
import { ToastProvider } from "./toast";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) return null;
    return new ConvexReactClient(url);
  }, []);

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md space-y-4">
          <p className="text-2xl font-semibold">NoteVault</p>
          <p className="text-sm text-muted">
            Connect Convex to get started. Run{" "}
            <code className="rounded bg-panel px-1.5 py-0.5 text-foreground">
              npx convex dev
            </code>{" "}
            and add{" "}
            <code className="rounded bg-panel px-1.5 py-0.5 text-foreground">
              NEXT_PUBLIC_CONVEX_URL
            </code>{" "}
            to <code className="rounded bg-panel px-1.5 py-0.5">.env.local</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      <PacerProvider defaultOptions={{ debouncer: { wait: 200 } }}>
        <ToastProvider>{children}</ToastProvider>
      </PacerProvider>
    </ConvexProviderWithClerk>
  );
}
