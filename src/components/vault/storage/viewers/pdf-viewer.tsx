"use client";

import { vaultFileUrl } from "./use-vault-file";
import { ViewerFrame } from "./viewer-shell";

export function PdfViewer({ fileId, fileName }: { fileId: string; fileName: string }) {
  return (
    <ViewerFrame className="overflow-hidden bg-muted/30 p-0">
      <iframe
        title={fileName}
        src={`${vaultFileUrl(fileId)}#view=FitH`}
        className="h-[min(70vh,720px)] w-full border-0"
      />
    </ViewerFrame>
  );
}
