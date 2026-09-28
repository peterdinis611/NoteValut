"use client";

import { Eye, X } from "lucide-react";
import { useMemo } from "react";
import { createPortal } from "react-dom";
import { AnimePresence } from "@/lib/anime-ui";
import { blocksToMarkdown, type Block } from "@/lib/blocks";
import { MarkdownView } from "./markdown-view";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  blocks: Block[];
};

export function MarkdownPreviewPanel({ open, onClose, title, blocks }: Props) {
  const source = useMemo(
    () => `# ${title || "Untitled"}\n\n${blocksToMarkdown(blocks)}`,
    [title, blocks],
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimePresence show={open} kind="overlay">
      <div className="create-dialog-overlay" onClick={onClose} role="presentation">
        <div
          className="md-preview-panel"
          role="dialog"
          aria-modal
          aria-labelledby="md-preview-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="create-dialog-header">
            <div>
              <h2 id="md-preview-title" className="create-dialog-title">
                Markdown preview
              </h2>
              <p className="create-dialog-subtitle">
                Rendered with{" "}
                <a
                  href="https://tanstack.com/markdown/latest"
                  target="_blank"
                  rel="noreferrer"
                  className="md-preview-link"
                >
                  TanStack Markdown
                </a>
              </p>
            </div>
            <button type="button" className="create-dialog-close" onClick={onClose} aria-label="Close">
              <X className="size-4" />
            </button>
          </header>

          <div className="md-preview-body note-scroll">
            {source.trim() ? (
              <MarkdownView>{source}</MarkdownView>
            ) : (
              <p className="settings-empty">Nothing to preview</p>
            )}
          </div>

          <footer className="md-preview-footer">
            <Eye className="size-3.5 opacity-70" />
            <span>Read-only view of this page as Markdown</span>
          </footer>
        </div>
      </div>
    </AnimePresence>,
    document.body,
  );
}
