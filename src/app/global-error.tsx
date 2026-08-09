"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LottieStatus,
  errorStatusDetails,
} from "@/components/lottie-status";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Catches errors in the root layout. Must define its own html/body. */
export default function GlobalError({ error, reset }: Props) {
  const [extras, setExtras] = useState<{ path?: string; when?: string }>({});

  useEffect(() => {
    console.error(error);
    setExtras({
      path: window.location.pathname || "/",
      when: new Date().toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "medium",
      }),
    });
  }, [error]);

  const details = useMemo(
    () => errorStatusDetails(error, extras),
    [error, extras],
  );

  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full bg-[#141210] font-sans text-[rgba(250,245,235,0.92)]">
        <LottieStatus
          variant="error"
          title="NoteVault crashed"
          description="A critical error stopped the app from rendering. Reload to get back in."
          detailPreview={details.detailPreview}
          detailRows={details.detailRows}
          detailStack={details.detailStack}
          actions={[
            { label: "Reload", onClick: reset, primary: true },
            { label: "Go home", href: "/" },
          ]}
        />
      </body>
    </html>
  );
}
