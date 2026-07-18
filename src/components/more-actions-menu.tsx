"use client";

import {
  Archive,
  ArchiveRestore,
  Copy,
  Download,
  FilePlus2,
  FolderPlus,
  LayoutTemplate,
  Link2,
  MoreHorizontal,
  Smile,
  SmilePlus,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { dropdownVariants, easeOutSoft } from "@/lib/motion";
import { UiTooltip } from "./ui-tooltip";

export type MoreActionItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

type Props = {
  items: MoreActionItem[];
};

export function MoreActionsMenu({ items }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="more-actions" ref={ref}>
      <UiTooltip label="More actions">
        <button
          type="button"
          className={`topbar-btn ${open ? "topbar-btn-open" : ""}`}
          aria-label="More actions"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((v) => !v)}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </UiTooltip>

      <AnimatePresence>
        {open && (
          <motion.div
            className="more-actions-menu"
            role="menu"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={easeOutSoft}
          >
            <p className="more-actions-label">More actions</p>
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                className={`more-actions-item ${item.danger ? "more-actions-item-danger" : ""}`}
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
              >
                <span className="more-actions-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const MoreActionIcons = {
  copy: <Copy className="size-3.5" />,
  download: <Download className="size-3.5" />,
  link: <Link2 className="size-3.5" />,
  archive: <Archive className="size-3.5" />,
  unarchive: <ArchiveRestore className="size-3.5" />,
  entry: <FilePlus2 className="size-3.5" />,
  collection: <FolderPlus className="size-3.5" />,
  showIcon: <SmilePlus className="size-3.5" />,
  hideIcon: <Smile className="size-3.5" />,
  template: <LayoutTemplate className="size-3.5" />,
};
