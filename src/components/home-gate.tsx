"use client";

import dynamic from "next/dynamic";
import { useAuth } from "@clerk/nextjs";
import { LottieStatus } from "@/components/lottie-status";

const MarketingLanding = dynamic(
  () => import("@/components/marketing-landing").then((m) => ({ default: m.MarketingLanding })),
  { ssr: true },
);

const NoteVaultApp = dynamic(
  () => import("@/components/note-vault-app").then((m) => ({ default: m.NoteVaultApp })),
  {
    ssr: false,
    loading: () => (
      <LottieStatus
        compact
        variant="loading"
        title="Opening your vault…"
        description="Loading the desk."
      />
    ),
  },
);

export function HomeGate() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <LottieStatus
        compact
        variant="loading"
        title="Opening NoteVault…"
        description="Checking your session."
      />
    );
  }

  if (isSignedIn) return <NoteVaultApp />;
  return <MarketingLanding />;
}
