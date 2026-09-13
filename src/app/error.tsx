"use client";

import { useEffect, useMemo, useState } from "react";
import { LottieStatus, errorStatusDetails } from "@/components/lottie-status";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: Props) {
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

  const details = useMemo(() => errorStatusDetails(error, extras), [error, extras]);

  return (
    <LottieStatus
      variant="error"
      title="Something went wrong"
      description="This screen hit an unexpected snag. Try again — your vault data is safe."
      detailPreview={details.detailPreview}
      detailRows={details.detailRows}
      detailStack={details.detailStack}
      actions={[
        { label: "Try again", onClick: reset, primary: true },
        { label: "Back to vault", href: "/" },
      ]}
    />
  );
}
