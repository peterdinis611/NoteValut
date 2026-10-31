"use client";

import { useMemo } from "react";
import { ViewerError, ViewerFrame, ViewerLoading } from "./viewer-shell";
import { useVaultFileText } from "./use-vault-file";

function prettyXml(raw: string): string {
  const compact = raw.replace(/>\s+</g, "><").trim();
  if (!compact) return "";

  let indent = 0;
  const lines: string[] = [];
  const parts = compact.replaceAll(/(>)(<)(\/*)/g, "$1\n$2$3").split("\n");

  for (const part of parts) {
    const line = part.trim();
    if (!line) continue;
    if (/^<\/.+>/.test(line)) indent = Math.max(0, indent - 1);
    lines.push(`${"  ".repeat(indent)}${line}`);
    if (
      /^<[^!?/][^>]*[^/]>$/.test(line) &&
      !/^<.+\/>$/.test(line) &&
      !/^<(?:\?|!).*>$/.test(line)
    ) {
      indent += 1;
    }
  }

  return lines.join("\n");
}

export function XmlViewer({ fileId }: { fileId: string }) {
  const state = useVaultFileText(fileId);
  const pretty = useMemo(
    () => (state.status === "ready" ? prettyXml(state.data) : ""),
    [state],
  );

  if (state.status === "loading") return <ViewerLoading label="Loading XML…" />;
  if (state.status === "error") return <ViewerError message={state.message} />;

  return (
    <ViewerFrame>
      <pre className="whitespace-pre overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-foreground">
        {pretty || state.data}
      </pre>
    </ViewerFrame>
  );
}
