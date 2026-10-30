"use client";

import { AppwriteProvider } from "@appwrite.io/react";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APPWRITE_SSR_BASE_PATH } from "@/lib/appwrite/env";

export function Providers({
  endpoint,
  projectId,
  session,
  children,
}: {
  endpoint: string;
  projectId: string;
  session?: string | null;
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AppwriteProvider
        endpoint={endpoint}
        projectId={projectId}
        ssr={{ session, basePath: APPWRITE_SSR_BASE_PATH }}
      >
        <TooltipProvider delay={200}>{children}</TooltipProvider>
      </AppwriteProvider>
    </ThemeProvider>
  );
}
