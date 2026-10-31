"use client";

import { Markdown } from "@tanstack/markdown/react";
import { ViewerError, ViewerFrame, ViewerLoading } from "./viewer-shell";
import { useVaultFileText } from "./use-vault-file";

export function MarkdownViewer({ fileId }: { fileId: string }) {
  const state = useVaultFileText(fileId);

  if (state.status === "loading") {
    return <ViewerLoading label="Loading markdown…" />;
  }
  if (state.status === "error") return <ViewerError message={state.message} />;

  return (
    <ViewerFrame className="p-5">
      <div className="prose prose-sm dark:prose-invert max-w-none font-sans text-foreground [&_a]:text-primary [&_code]:font-mono [&_pre]:rounded-xl [&_pre]:bg-muted [&_pre]:p-3">
        <Markdown>{state.data}</Markdown>
      </div>
    </ViewerFrame>
  );
}
