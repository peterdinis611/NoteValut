"use client";

import dynamic from "next/dynamic";
import { useAuth } from "@clerk/nextjs";
import { VaultPreload } from "@/components/ui/spinner";

const MarketingLanding = dynamic(
  () => import("@/components/marketing-landing").then((m) => ({ default: m.MarketingLanding })),
  { ssr: true },
);

const NoteVaultApp = dynamic(
  () => import("@/components/note-vault-app").then((m) => ({ default: m.NoteVaultApp })),
  {
    ssr: false,
    loading: () => (
      <VaultPreload
        compact
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
      <VaultPreload
        compact
        title="Opening NoteVault…"
        description="Checking your session."
      />
    );
  }

  if (isSignedIn) return <NoteVaultApp />;
  return <MarketingLanding />;
}
