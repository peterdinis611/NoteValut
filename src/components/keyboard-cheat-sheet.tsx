"use client";

import { Keyboard, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { easeOutSoft, modalVariants, overlayVariants } from "@/lib/motion";

type Shortcut = { keys: string; action: string };
type Group = { title: string; items: Shortcut[] };

const GROUPS: Group[] = [
  {
    title: "App",
    items: [
      { keys: "⌘ K", action: "Command palette" },
      { keys: "⌘ /", action: "Keyboard shortcuts" },
      { keys: "Esc", action: "Close dialogs" },
    ],
  },
  {
    title: "Editor",
    items: [
      { keys: "/", action: "Slash commands" },
      { keys: "[[", action: "Mention / link page" },
      { keys: "⌘ B / I / E", action: "Bold / italic / code" },
      { keys: "⌘ ⇧ H", action: "Highlight" },
      { keys: "Tab / ⇧ Tab", action: "Indent / outdent" },
      { keys: "Enter", action: "New block" },
      { keys: "Backspace", action: "Delete empty block" },
      { keys: "⌘ ↑ / ⌘ ↓", action: "Move block" },
      { keys: "Esc", action: "Exit code edit / menus" },
    ],
  },
  {
    title: "Markdown",
    items: [
      { keys: "# … ######", action: "Headings" },
      { keys: "- or *", action: "Bullet list" },
      { keys: "1.", action: "Numbered list" },
      { keys: "[]", action: "To-do" },
      { keys: ">", action: "Quote" },
      { keys: "```", action: "Code block" },
    ],
  },
  {
    title: "Headings",
    items: [
      { keys: "⌘ ⌥ 1–6", action: "Set heading level" },
    ],
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function KeyboardCheatSheet({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="shortcuts-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.15 }}
        >
          <button type="button" className="shortcuts-backdrop" aria-label="Close" onClick={onClose} />
          <motion.div
            className="shortcuts-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={easeOutSoft}
          >
            <header className="shortcuts-head">
              <div className="shortcuts-title-row">
                <Keyboard className="size-4 text-accent" />
                <h2 className="shortcuts-title">Keyboard shortcuts</h2>
              </div>
              <button type="button" className="shortcuts-close" aria-label="Close" onClick={onClose}>
                <X className="size-4" />
              </button>
            </header>
            <div className="shortcuts-body note-scroll">
              {GROUPS.map((group) => (
                <section key={group.title} className="shortcuts-group">
                  <h3 className="shortcuts-group-title">{group.title}</h3>
                  <ul className="shortcuts-list">
                    {group.items.map((item) => (
                      <li key={item.keys} className="shortcuts-row">
                        <span className="shortcuts-action">{item.action}</span>
                        <kbd className="shortcuts-keys">{item.keys}</kbd>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
