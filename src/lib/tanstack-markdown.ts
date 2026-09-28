/**
 * TanStack Markdown helpers for NoteVault.
 * @see https://tanstack.com/markdown/latest
 */
import { docsMarkdownExtensions } from "@tanstack/markdown/extensions/docs";
import { streamingMarkdownExtension } from "@tanstack/markdown/extensions/streaming";
import { parseMarkdown } from "@tanstack/markdown/parser";
import { renderHtml } from "@tanstack/markdown/html";
import type { MarkdownDocument, ParseOptions, RenderOptions } from "@tanstack/markdown";
import { createTanStackMarkdownHighlighter } from "@tanstack/highlight/markdown";
import { getVaultHighlighter } from "@/lib/highlight";

const codeHighlighter = createTanStackMarkdownHighlighter(getVaultHighlighter());

export type { MarkdownDocument };

export function vaultMarkdownParseOptions(streaming = false): ParseOptions {
  return {
    frontmatter: true,
    headingIds: true,
    extensions: streaming
      ? [...docsMarkdownExtensions(), streamingMarkdownExtension()]
      : docsMarkdownExtensions(),
  };
}

export function vaultMarkdownRenderOptions(streaming = false): RenderOptions {
  return {
    ...vaultMarkdownParseOptions(streaming),
    highlighter: codeHighlighter,
    codeLineNumbers: false,
    headingAnchors: {
      content: "#",
      className: "nv-md-anchor",
      ariaHidden: true,
    },
  };
}

export function parseVaultMarkdown(source: string, streaming = false): MarkdownDocument {
  return parseMarkdown(source, vaultMarkdownParseOptions(streaming));
}

export function renderVaultMarkdownHtml(source: string, streaming = false): string {
  return renderHtml(source, vaultMarkdownRenderOptions(streaming));
}
