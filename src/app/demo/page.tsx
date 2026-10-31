import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { VaultDashboard } from "@/components/vault/vault-dashboard";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Demo",
  description:
    "Try the NoteValut demo shelf — local seed notes, folders, and the Notion-like editor without signing in.",
  path: "/demo",
});

export default function DemoPage() {
  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-1 flex-col overflow-hidden">
      <header className="relative z-50 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Demo shelf</span>
          {" — "}
          local seed only — folders/pages sync on /vault when signed in.
        </p>
        <nav aria-label="Demo shortcuts" className="flex items-center gap-3">
          <Link href="/signup" className="transition-colors hover:text-foreground">
            Create account
          </Link>
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
        </nav>
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden" id="main-content">
        <Suspense
          fallback={
            <p className="p-6 font-mono text-sm text-muted-foreground">
              Loading demo shelf…
            </p>
          }
        >
          <VaultDashboard accountLabel="Demo visitor" />
        </Suspense>
      </main>
    </div>
  );
}
