"use client";

import { Eye, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { VaultEditor } from "@/editor";
import { AnimePresence } from "@/lib/anime-ui";
import type { Block } from "@/lib/blocks";

export type PreviewableTemplate = {
  id: string;
  name: string;
  icon: string;
  description: string;
  tags?: string[];
  blocks: Block[];
  builtIn?: boolean;
};

type Props = {
  template: PreviewableTemplate | null;
  onClose: () => void;
};

export function TemplatePreviewDialog({ template, onClose }: Props) {
  const lastTemplate = useRef(template);
  if (template) lastTemplate.current = template;
  const preview = lastTemplate.current;

  useEffect(() => {
    if (!template) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [template, onClose]);

  return (
    <AnimePresence show={!!template} kind="overlay">
      <div className="share-overlay" onClick={onClose}>
        {preview ? (
          <div
            className="template-preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-preview-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="template-preview-header">
              <div className="min-w-0 flex-1">
                <p className="template-preview-kicker">
                  <Eye className="size-3.5" />
                  Template preview
                  {preview.builtIn ? " · Built-in" : " · Custom"}
                </p>
                <h2 id="template-preview-title" className="template-preview-title">
                  <span aria-hidden>{preview.icon}</span>
                  {preview.name}
                </h2>
                <p className="template-preview-desc">{preview.description}</p>
                {preview.tags && preview.tags.length > 0 && (
                  <div className="template-preview-tags">
                    {preview.tags.map((tag) => (
                      <span key={tag} className="template-preview-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="settings-close"
                onClick={onClose}
                aria-label="Close preview"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="template-preview-body note-scroll">
              <VaultEditor blocks={preview.blocks} onChange={() => {}} readOnly />
            </div>
          </div>
        ) : null}
      </div>
    </AnimePresence>
  );
}
