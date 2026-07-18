"use client";

import { useEffect } from "react";
import { LottieStatus } from "@/components/lottie-status";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <LottieStatus
      variant="error"
      title="Something went wrong"
      description={
        error.message?.trim()
          ? error.message
          : "An unexpected error occurred while loading this page."
      }
      actions={[
        { label: "Try again", onClick: reset, primary: true },
        { label: "Back to vault", href: "/" },
      ]}
    >
      {error.digest ? (
        <p className="status-meta">Error ID: {error.digest}</p>
      ) : null}
    </LottieStatus>
  );
}
