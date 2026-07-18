"use client";

import { FileText, FolderOpen, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { removeCustomTemplate } from "@/db/templates-collection";
import { useCustomTemplates } from "@/hooks/use-custom-templates";
import { dropdownVariants, easeOutSoft } from "@/lib/motion";
import { PAGE_TEMPLATES } from "@/lib/templates";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreateEntry: (templateId: string) => void;
  onCreateCollection: () => void;
};

export function CreateMenu({ open, onClose, onCreateEntry, onCreateCollection }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const custom = useCustomTemplates();

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (ref.current?.contains(target)) return;
      if ((target as Element).closest?.("[data-create-trigger]")) return;
      onClose();
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          className="create-menu"
          variants={dropdownVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={easeOutSoft}
        >
          <p className="create-menu-label">Create new</p>
          <button
            type="button"
            className="create-menu-item"
            onClick={() => {
              onCreateCollection();
              onClose();
            }}
          >
            <FolderOpen className="size-4 text-accent" />
            <span>
              <span className="block text-sm font-medium">Collection</span>
              <span className="block text-xs text-muted">Folder to organize entries</span>
            </span>
          </button>

          {custom.length > 0 && (
            <>
              <p className="create-menu-divider">Your templates</p>
              {custom.map((template) => (
                <div key={template.id} className="create-menu-row">
                  <button
                    type="button"
                    className="create-menu-item"
                    onClick={() => {
                      onCreateEntry(template.id);
                      onClose();
                    }}
                  >
                    <span className="text-lg">{template.icon}</span>
                    <span>
                      <span className="block text-sm font-medium">{template.name}</span>
                      <span className="block text-xs text-muted">
                        {template.description || "Custom template"}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="create-menu-remove"
                    aria-label={`Delete template ${template.name}`}
                    title="Delete template"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomTemplate(template.id);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </>
          )}

          <p className="create-menu-divider">Default templates</p>
          {PAGE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              className="create-menu-item"
              onClick={() => {
                onCreateEntry(template.id);
                onClose();
              }}
            >
              <span className="text-lg">{template.icon}</span>
              <span>
                <span className="block text-sm font-medium">{template.name}</span>
                <span className="block text-xs text-muted">{template.description}</span>
              </span>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CreateMenuTrigger({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className="sidebar-new-page" onClick={onClick}>
      <FileText className="size-4" />
      {children}
    </button>
  );
}
