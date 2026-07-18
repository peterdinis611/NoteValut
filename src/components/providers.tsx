"use client";

import { PacerProvider } from "@tanstack/react-pacer";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import {
  createDarkTheme,
  FluentProvider,
  type BrandVariants,
} from "@fluentui/react-components";
import { ReactNode, useMemo } from "react";
import { ToastProvider } from "./toast";

const brand: BrandVariants = {
  10: "#1a1529",
  20: "#2a2240",
  30: "#3a3058",
  40: "#4a3e70",
  50: "#5a4c88",
  60: "#6b5ce0",
  70: "#7c6df0",
  80: "#8d7ef2",
  90: "#9e8ff4",
  100: "#afa0f6",
  110: "#c0b1f8",
  120: "#d1c2fa",
  130: "#e2d3fc",
  140: "#f3e4fe",
  150: "#faf5ff",
  160: "#ffffff",
};

const theme = createDarkTheme(brand);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) return null;
    return new ConvexReactClient(url);
  }, []);

  if (!client) {
    return (
      <FluentProvider theme={theme}>
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
      </FluentProvider>
    );
  }

  return (
    <FluentProvider theme={theme}>
      <ConvexProvider client={client}>
        <PacerProvider defaultOptions={{ debouncer: { wait: 200 } }}>
          <ToastProvider>{children}</ToastProvider>
        </PacerProvider>
      </ConvexProvider>
    </FluentProvider>
  );
}
