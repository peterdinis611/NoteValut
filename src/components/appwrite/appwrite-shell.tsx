import { Suspense } from "react";
import { getAppwritePublicConfig } from "@/lib/appwrite/env";
import { createAppwriteServer } from "@/lib/appwrite/server";
import { Providers } from "@/app/providers";

async function AppwriteSessionProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const { endpoint, projectId } = getAppwritePublicConfig();
  const session = await createAppwriteServer().readSessionCookie();

  return (
    <Providers endpoint={endpoint} projectId={projectId} session={session}>
      {children}
    </Providers>
  );
}

function AppwriteProvidersFallback({ children }: { children: React.ReactNode }) {
  const { endpoint, projectId } = getAppwritePublicConfig();

  return (
    <Providers endpoint={endpoint} projectId={projectId} session={null}>
      {children}
    </Providers>
  );
}

/** Wraps the tree with AppwriteProvider; session cookie is read inside Suspense. */
export function AppwriteShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppwriteProvidersFallback>{children}</AppwriteProvidersFallback>}>
      <AppwriteSessionProviders>{children}</AppwriteSessionProviders>
    </Suspense>
  );
}
