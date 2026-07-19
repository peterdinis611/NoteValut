"use client";

import { Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { IconPicker } from "@/components/icon-picker";
import { VaultEditor } from "@/editor";
import { createBlock, type Block } from "@/lib/blocks";
import { createCustomTemplate } from "@/lib/create-custom-template";
import { easeOutSoft, easeQuick, modalVariants, overlayVariants } from "@/lib/motion";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: (name: string) => void;
};

export function TemplateEditorDialog({ open, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✦");
  const [description, setDescription] = useState("");
  const [tagsDraft, setTagsDraft] = useState("");
  const [blocks, setBlocks] = useState<Block[]>(() => [
    createBlock("heading2", "Section"),
    createBlock("paragraph", ""),
  ]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setIcon("✦");
    setDescription("");
    setTagsDraft("");
    setBlocks([createBlock("heading2", "Section"), createBlock("paragraph", "")]);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function handleSave() {
    const result = createCustomTemplate({
      name,
      icon,
      description,
      tagsDraft,
      blocks,
    });
    if (!result.success) {
      setError(result.error);
      return;
    }
    onSaved?.(result.name);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
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
            className="template-editor-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-editor-title"
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
                  <Plus className="size-3.5" />
                  New template
                </p>
                <h2 id="template-editor-title" className="template-preview-title">
                  Create template
                </h2>
                <p className="template-preview-desc">
                  Define starter blocks for new pages from the create menu
                </p>
              </div>
              <button
                type="button"
                className="settings-close"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="template-editor-meta">
              <div className="template-editor-icon">
                <IconPicker value={icon} onChange={setIcon} size="sm" />
              </div>
              <label className="settings-field template-editor-name">
                Name
                <input
                  className="settings-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sprint retro"
                  maxLength={60}
                  autoFocus
                />
              </label>
            </div>

            <div className="template-editor-fields">
              <label className="settings-field">
                Description
                <input
                  className="settings-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short hint shown in the create menu"
                  maxLength={120}
                />
              </label>
              <label className="settings-field">
                Tags
                <input
                  className="settings-input"
                  value={tagsDraft}
                  onChange={(e) => setTagsDraft(e.target.value)}
                  placeholder="Comma-separated, e.g. work, planning"
                />
              </label>
            </div>

            <div className="template-editor-body note-scroll">
              <p className="template-editor-body-label">Starter content</p>
              <VaultEditor blocks={blocks} onChange={setBlocks} />
            </div>

            {error && <p className="template-editor-error">{error}</p>}

            <footer className="template-editor-footer">
              <button type="button" className="settings-btn settings-btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="vault-btn-primary" onClick={handleSave}>
                <Plus className="size-3.5" />
                Save template
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
