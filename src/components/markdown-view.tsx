"use client";

import { Markdown } from "@tanstack/markdown/react";
import type { MarkdownInput } from "@tanstack/markdown";
import { vaultMarkdownRenderOptions } from "@/lib/tanstack-markdown";

type Props = {
  children: MarkdownInput;
  /** Soften incomplete fences while AI text streams in */
  streaming?: boolean;
  className?: string;
};

/** Vault-styled TanStack Markdown renderer (safe HTML defaults + Highlight). */
export function MarkdownView({ children, streaming = false, className }: Props) {
  const options = vaultMarkdownRenderOptions(streaming);
  return (
    <div className={`nv-markdown ${className ?? ""}`.trim()}>
      <Markdown {...options}>{children}</Markdown>
    </div>
  );
}
