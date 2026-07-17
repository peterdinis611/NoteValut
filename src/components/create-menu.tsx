"use client";

import { FileText, FolderOpen } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
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

          <p className="create-menu-divider">Entry templates</p>
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
