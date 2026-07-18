"use client";

import { LottieStatus } from "@/components/lottie-status";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Catches errors in the root layout. Must define its own html/body. */
export default function GlobalError({ error, reset }: Props) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full bg-[#12151c] font-sans text-white/90">
        <LottieStatus
          variant="error"
          title="NoteVault crashed"
          description={
            error.message?.trim() ||
            "A critical error stopped the app from rendering."
          }
          actions={[
            { label: "Reload", onClick: reset, primary: true },
            { label: "Go home", href: "/" },
          ]}
        />
      </body>
    </html>
  );
}
