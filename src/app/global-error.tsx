"use client";

import { useEffect } from "react";
import { Bricolage_Grotesque, Figtree, JetBrains_Mono } from "next/font/google";
import { StatusScreen } from "@/components/status/status-screen";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const sans = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <title>Server error · NoteValut</title>
        <ThemeProvider>
          <StatusScreen
            code="500"
            title="The vault hit a snag"
            description="A root-level error interrupted NoteValut. Retry to reopen the shelf, or return later."
            primaryHref="/"
            primaryLabel="Back home"
            onRetry={retry}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
