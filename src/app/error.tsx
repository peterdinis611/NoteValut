"use client";

import { useEffect } from "react";
import { StatusScreen } from "@/components/status/status-screen";

export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest =
    error && typeof error === "object" && "digest" in error
      ? String((error as { digest?: string }).digest ?? "")
      : "";

  return (
    <StatusScreen
      code="500"
      title="Something slipped off the shelf"
      description={
        digest
          ? `An unexpected error paused this view. You can retry, or come back later. Reference: ${digest}`
          : "An unexpected error paused this view. Retry the page, or return home while we settle things."
      }
      primaryHref="/"
      primaryLabel="Back home"
      onRetry={retry}
    />
  );
}
