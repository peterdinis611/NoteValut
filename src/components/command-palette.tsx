"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import {
  Archive,
  Download,
  FolderOpen,
  Hash,
  Home,
  Plus,
  Search,
  Settings2,
  StickyNote,
  Tag,
  Upload,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { isFolder } from "@/lib/item-kinds";
import { searchNotes } from "@/lib/search";
import { easeOutSoft, easeQuick, modalVariants, overlayVariants } from "@/lib/motion";

export type CommandAction = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  keywords?: string[];
  run: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  notes: Doc<"notes">[] | undefined;
  actions: CommandAction[];
  onNavigate: (id: Id<"notes">) => void;
};

export function CommandPalette({ open, onClose, notes, actions, onNavigate }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(query, { wait: 80 });
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setIndex(0);
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  const noteHits = useMemo(() => {
    if (!notes) return [];
    const q = debouncedQuery.trim();
    const pool = notes.filter((n) => !isFolder(n));
    if (!q) return pool.slice(0, 8);
    return searchNotes(pool, q).slice(0, 12);
  }, [notes, debouncedQuery]);

  const actionHits = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.hint?.toLowerCase().includes(q) ||
        a.keywords?.some((k) => k.includes(q)),
    );
  }, [actions, debouncedQuery]);

  type Row =
    | { kind: "action"; action: CommandAction }
    | { kind: "note"; note: Doc<"notes"> };

  const rows: Row[] = useMemo(() => {
    const list: Row[] = actionHits.map((action) => ({ kind: "action", action }));
    for (const note of noteHits) {
      list.push({ kind: "note", note });
    }
    return list;
  }, [actionHits, noteHits]);

  useEffect(() => {
    setIndex(0);
  }, [debouncedQuery, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, Math.max(rows.length - 1, 0)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const row = rows[index];
        if (!row) return;
        if (row.kind === "action") row.action.run();
        else onNavigate(row.note._id);
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, rows, index, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cmd-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={easeQuick}
          onClick={onClose}
        >
          <motion.div
            className="cmd-palette"
            role="dialog"
            aria-modal
            aria-label="Command palette"
            variants={modalVariants}
            transition={easeOutSoft}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cmd-input-row">
              <Search className="size-4 text-muted" />
              <input
                ref={inputRef}
                className="cmd-input"
                placeholder="Search notes or run a command…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd className="cmd-kbd">esc</kbd>
            </div>

            <div className="cmd-list note-scroll">
              {rows.length === 0 ? (
                <p className="cmd-empty">No matches</p>
              ) : (
                <>
                  {actionHits.length > 0 && (
                    <p className="cmd-section">Commands</p>
                  )}
                  {rows.map((row, i) => {
                    if (row.kind === "action") {
                      const { action } = row;
                      return (
                        <button
                          key={`a-${action.id}`}
                          type="button"
                          className={`cmd-row ${i === index ? "cmd-row-active" : ""}`}
                          onMouseEnter={() => setIndex(i)}
                          onClick={() => {
                            action.run();
                            onClose();
                          }}
                        >
                          <span className="cmd-row-icon">{action.icon}</span>
                          <span className="min-w-0 flex-1 text-left">
                            <span className="block truncate text-sm">{action.label}</span>
                            {action.hint && (
                              <span className="block truncate text-xs text-muted">{action.hint}</span>
                            )}
                          </span>
                        </button>
                      );
                    }
                    const showDivider =
                      actionHits.length > 0 && i === actionHits.length;
                    return (
                      <div key={`n-${row.note._id}`}>
                        {showDivider && <p className="cmd-section">Notes</p>}
                        <button
                          type="button"
                          className={`cmd-row ${i === index ? "cmd-row-active" : ""}`}
                          onMouseEnter={() => setIndex(i)}
                          onClick={() => {
                            onNavigate(row.note._id);
                            onClose();
                          }}
                        >
                          <span className="cmd-row-icon text-base">{row.note.icon}</span>
                          <span className="min-w-0 flex-1 text-left">
                            <span className="block truncate text-sm">
                              {row.note.title || "Untitled"}
                            </span>
                            {row.note.tags.length > 0 && (
                              <span className="block truncate text-xs text-muted">
                                {row.note.tags.map((t) => `#${t}`).join(" ")}
                              </span>
                            )}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const CommandIcons = {
  home: <Home className="size-3.5" />,
  settings: <Settings2 className="size-3.5" />,
  create: <Plus className="size-3.5" />,
  collection: <FolderOpen className="size-3.5" />,
  page: <StickyNote className="size-3.5" />,
  tags: <Tag className="size-3.5" />,
  archive: <Archive className="size-3.5" />,
  capture: <Zap className="size-3.5" />,
  export: <Download className="size-3.5" />,
  import: <Upload className="size-3.5" />,
  hash: <Hash className="size-3.5" />,
};
