"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuickCapture } from "@/components/quick-capture";
import { useOwnerId } from "@/hooks/use-owner-id";

function ShareTargetInner() {
  const ownerId = useOwnerId();
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(true);

  const seed = useMemo(() => {
    const title = params.get("title") || params.get("text") || "";
    const url = params.get("url") || "";
    const parts = [title, url].filter(Boolean);
    return parts.join("\n\n").trim();
  }, [params]);

  useEffect(() => {
    if (!open) router.replace("/");
  }, [open, router]);

  if (!ownerId) {
    return (
      <main className="share-target-wait">
        <p>Sign in to capture shared content…</p>
      </main>
    );
  }

  return (
    <main className="share-target-page">
      <QuickCapture
        ownerId={ownerId}
        open={open}
        onClose={() => setOpen(false)}
        initialText={seed || undefined}
      />
    </main>
  );
}

export default function ShareTargetPage() {
  return (
    <Suspense fallback={<main className="share-target-wait"><p>Loading…</p></main>}>
      <ShareTargetInner />
    </Suspense>
  );
}
