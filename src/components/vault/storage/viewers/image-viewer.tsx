"use client";

import { vaultFileUrl } from "./use-vault-file";
import { ViewerFrame } from "./viewer-shell";

export function ImageViewer({
  fileId,
  fileName,
}: {
  fileId: string;
  fileName: string;
}) {
  return (
    <ViewerFrame className="flex items-center justify-center bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--muted)_80%,transparent),transparent_70%)] p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={vaultFileUrl(fileId)}
        alt={fileName}
        className="max-h-[min(65vh,680px)] max-w-full rounded-[10px] object-contain shadow-md ring-1 ring-border"
      />
    </ViewerFrame>
  );
}
