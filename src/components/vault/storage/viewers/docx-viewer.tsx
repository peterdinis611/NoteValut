"use client";

import { useEffect, useState } from "react";
import { sanitizeEmailHtml } from "@/lib/editor/sanitize";
import { ViewerError, ViewerFrame, ViewerLoading } from "./viewer-shell";
import { useVaultFileBuffer } from "./use-vault-file";

type DocxState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; html: string };

export function DocxViewer({ fileId }: { fileId: string }) {
  const bufferState = useVaultFileBuffer(fileId);
  const [state, setState] = useState<DocxState>({ status: "loading" });

  useEffect(() => {
    if (bufferState.status === "loading") {
      setState({ status: "loading" });
      return;
    }
    if (bufferState.status === "error") {
      setState({ status: "error", message: bufferState.message });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    void (async () => {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.convertToHtml({
          arrayBuffer: bufferState.data,
        });
        if (!cancelled) {
          setState({
            status: "ready",
            html: sanitizeEmailHtml(
              result.value || "<p><em>Empty document.</em></p>",
            ),
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not render this Word document.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bufferState]);

  if (state.status === "loading") {
    return <ViewerLoading label="Rendering Word doc…" />;
  }
  if (state.status === "error") return <ViewerError message={state.message} />;

  return (
    <ViewerFrame className="p-5">
      <div
        className="prose prose-sm dark:prose-invert max-w-none font-sans text-foreground [&_a]:text-primary [&_p]:leading-relaxed [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1"
        dangerouslySetInnerHTML={{ __html: state.html }}
      />
    </ViewerFrame>
  );
}
