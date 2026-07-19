"use client";

import { Eye, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { VaultEditor } from "@/editor";
import type { Block } from "@/lib/blocks";
import { easeOutSoft, easeQuick, modalVariants, overlayVariants } from "@/lib/motion";

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
  useEffect(() => {
    if (!template) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [template, onClose]);

  return (
    <AnimatePresence>
      {template && (
        <motion.div
          className="share-overlay"
          onClick={onClose}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={easeQuick}
        >
          <motion.div
            className="template-preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-preview-title"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={easeOutSoft}
          >
            <header className="template-preview-header">
              <div className="min-w-0 flex-1">
                <p className="template-preview-kicker">
                  <Eye className="size-3.5" />
                  Template preview
                  {template.builtIn ? " · Built-in" : " · Custom"}
                </p>
                <h2 id="template-preview-title" className="template-preview-title">
                  <span aria-hidden>{template.icon}</span>
                  {template.name}
                </h2>
                <p className="template-preview-desc">{template.description}</p>
                {template.tags && template.tags.length > 0 && (
                  <div className="template-preview-tags">
                    {template.tags.map((tag) => (
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
              <VaultEditor
                blocks={template.blocks}
                onChange={() => {}}
                readOnly
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
