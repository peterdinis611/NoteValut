"use client";

import { ViewerError, ViewerFrame, ViewerLoading } from "./viewer-shell";
import { useVaultFileText } from "./use-vault-file";

export function TextViewer({ fileId }: { fileId: string }) {
  const state = useVaultFileText(fileId);

  if (state.status === "loading") return <ViewerLoading label="Loading text…" />;
  if (state.status === "error") return <ViewerError message={state.message} />;

  return (
    <ViewerFrame>
      <pre className="whitespace-pre-wrap break-words p-4 font-mono text-[12.5px] leading-relaxed text-foreground">
        {state.data}
      </pre>
    </ViewerFrame>
  );
}
