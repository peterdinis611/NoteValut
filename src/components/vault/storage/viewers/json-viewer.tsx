"use client";

import { useMemo } from "react";
import { ViewerError, ViewerFrame, ViewerLoading } from "./viewer-shell";
import { useVaultFileText } from "./use-vault-file";

export function JsonViewer({ fileId }: { fileId: string }) {
  const state = useVaultFileText(fileId);
  const pretty = useMemo(() => {
    if (state.status !== "ready") return "";
    try {
      return JSON.stringify(JSON.parse(state.data), null, 2);
    } catch {
      return state.data;
    }
  }, [state]);

  if (state.status === "loading") return <ViewerLoading label="Loading JSON…" />;
  if (state.status === "error") return <ViewerError message={state.message} />;

  return (
    <ViewerFrame>
      <pre className="whitespace-pre overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-foreground">
        {pretty}
      </pre>
    </ViewerFrame>
  );
}
