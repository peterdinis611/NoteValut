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

  const tech = [error.message?.trim(), error.digest ? `ID: ${error.digest}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <LottieStatus
      variant="error"
      title="Something went wrong"
      description="This screen hit an unexpected snag. Try again — your vault data is safe."
      detail={tech || undefined}
      actions={[
        { label: "Try again", onClick: reset, primary: true },
        { label: "Back to vault", href: "/" },
      ]}
    />
  );
}
