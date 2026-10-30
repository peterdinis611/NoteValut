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
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-black/6 bg-[#f3f3f1] px-4 py-2.5 text-sm text-black/55">
        <p>
          <span className="font-medium text-black/75">Demo shelf</span>
          {" — "}
          local seed only — folders/pages sync on /vault when signed in.
        </p>
        <nav aria-label="Demo shortcuts" className="flex items-center gap-3">
          <Link href="/signup" className="hover:text-black/80">
            Create account
          </Link>
          <Link href="/" className="hover:text-black/80">
            Home
          </Link>
        </nav>
      </header>
      <main className="flex min-h-0 flex-1 flex-col" id="main-content">
        <Suspense
          fallback={
            <p className="p-6 font-mono text-sm text-black/45">
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
