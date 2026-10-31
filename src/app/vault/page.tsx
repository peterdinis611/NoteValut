import type { Metadata } from "next";
import { Suspense } from "react";
import { VaultDashboard } from "@/components/vault/vault-dashboard";
import { VaultPreload } from "@/components/vault/vault-preload";
import { getSessionAccount } from "@/domain/account";
import { runServer } from "@/lib/effect-server";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Vault",
  description: "Your private NoteValut workspace.",
  path: "/vault",
  noIndex: true,
});

async function VaultWithSession() {
  const account = await runServer(getSessionAccount());
  const label = account?.name || account?.email || null;

  return <VaultDashboard accountLabel={label} persist />;
}

export default function VaultPage() {
  return (
    <main
      id="main-content"
      className="flex h-dvh max-h-dvh min-h-0 flex-1 flex-col overflow-hidden"
    >
      <Suspense fallback={<VaultPreload label="Opening vault…" />}>
        <VaultWithSession />
      </Suspense>
    </main>
  );
}
