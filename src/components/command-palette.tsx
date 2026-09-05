"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useQuery } from "convex/react";
import {
  Archive,
  CalendarClock,
  CalendarDays,
  Download,
  FolderOpen,
  Hash,
  Home,
  Keyboard,
  Network,
  Plus,
  Search,
  Settings2,
  Share2,
  StickyNote,
  Sun,
  Tag,
  Upload,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
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
  onOpenTag?: (tag: string) => void;
  ownerId?: string;
};

export function CommandPalette({
  open,
  onClose,
  notes,
  actions,
  onNavigate,
  onOpenTag,
  ownerId,
}: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(query, { wait: 80 });
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = debouncedQuery.trim();
  const qLower = q.toLowerCase();
  const tagQuery = qLower.startsWith("#") ? qLower.slice(1).trim() : qLower;

  const serverHits = useQuery(
    api.notes.search,
    open && ownerId && q.length >= 2 && !q.startsWith("#")
      ? { ownerId, query: q, limit: 12 }
      : "skip",
  );
  const tagRows = useQuery(
    api.notes.listTags,
    open && ownerId ? { ownerId } : "skip",
  );

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
    if (!notes || q.startsWith("#")) return [];
    const pool = notes.filter((n) => !isFolder(n));
    if (!q) return pool.slice(0, 8);
    if (q.length >= 2 && serverHits !== undefined) {
      if (serverHits.length > 0) return serverHits;
    }
    return searchNotes(pool, q).slice(0, 12);
  }, [notes, q, serverHits]);

  const actionHits = useMemo(() => {
    if (!qLower || q.startsWith("#")) {
      return q.startsWith("#") ? [] : q ? actions.filter(matchAction(qLower)) : actions;
    }
    return actions.filter(matchAction(qLower));
  }, [actions, q, qLower]);

  const tagHits = useMemo(() => {
    if (!tagRows?.length || !onOpenTag) return [];
    const showAll = !q || q.startsWith("#") || qLower.includes("tag");
    if (!showAll && tagQuery.length < 1) return [];
    const filtered = tagRows.filter((t) => {
      if (!tagQuery) return q.startsWith("#") || !q;
      return (
        t.tag.toLowerCase().includes(tagQuery) ||
        t.key.includes(tagQuery)
      );
    });
    return filtered.slice(0, q.startsWith("#") ? 16 : 6);
  }, [tagRows, tagQuery, q, qLower, onOpenTag]);

  type Row =
    | { kind: "action"; action: CommandAction }
    | { kind: "tag"; tag: string; count: number }
    | { kind: "note"; note: Doc<"notes"> };

  const rows: Row[] = useMemo(() => {
    const list: Row[] = [];
    for (const action of actionHits) list.push({ kind: "action", action });
    for (const t of tagHits) list.push({ kind: "tag", tag: t.tag, count: t.count });
    for (const note of noteHits) list.push({ kind: "note", note });
    return list;
  }, [actionHits, tagHits, noteHits]);

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
        else if (row.kind === "tag") onOpenTag?.(row.tag);
        else onNavigate(row.note._id);
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, rows, index, onClose, onNavigate, onOpenTag]);

  const ftsPending = q.length >= 2 && !q.startsWith("#") && serverHits === undefined;

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
                placeholder="Search notes, #tags, or run a command…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd className="cmd-kbd">esc</kbd>
            </div>
            <p className="cmd-hint">
              Type to search · <span>#tag</span> for tags · ↑↓ enter · ⌘K
              {ftsPending ? " · indexing…" : ""}
            </p>

            <div className="cmd-list note-scroll">
              {rows.length === 0 ? (
                <p className="cmd-empty">No matches</p>
              ) : (
                <>
                  {rows.map((row, i) => {
                    if (row.kind === "action") {
                      const showSection = i === 0;
                      return (
                        <div key={`a-${row.action.id}`}>
                          {showSection && <p className="cmd-section">Commands</p>}
                          <button
                            type="button"
                            className={`cmd-row ${i === index ? "cmd-row-active" : ""}`}
                            onMouseEnter={() => setIndex(i)}
                            onClick={() => {
                              row.action.run();
                              onClose();
                            }}
                          >
                            <span className="cmd-row-icon">{row.action.icon}</span>
                            <span className="min-w-0 flex-1 text-left">
                              <span className="block truncate text-sm">{row.action.label}</span>
                              {row.action.hint && (
                                <span className="block truncate text-xs text-muted">
                                  {row.action.hint}
                                </span>
                              )}
                            </span>
                          </button>
                        </div>
                      );
                    }
                    if (row.kind === "tag") {
                      const showSection =
                        i === actionHits.length ||
                        (actionHits.length === 0 && i === 0);
                      return (
                        <div key={`t-${row.tag}`}>
                          {showSection && <p className="cmd-section">Tags</p>}
                          <button
                            type="button"
                            className={`cmd-row ${i === index ? "cmd-row-active" : ""}`}
                            onMouseEnter={() => setIndex(i)}
                            onClick={() => {
                              onOpenTag?.(row.tag);
                              onClose();
                            }}
                          >
                            <span className="cmd-row-icon">
                              <Hash className="size-3.5" />
                            </span>
                            <span className="min-w-0 flex-1 text-left">
                              <span className="block truncate text-sm">#{row.tag}</span>
                              <span className="block truncate text-xs text-muted">
                                {row.count} {row.count === 1 ? "note" : "notes"}
                              </span>
                            </span>
                          </button>
                        </div>
                      );
                    }
                    const noteStart = actionHits.length + tagHits.length;
                    const showSection = i === noteStart;
                    return (
                      <div key={`n-${row.note._id}`}>
                        {showSection && <p className="cmd-section">Notes</p>}
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

function matchAction(q: string) {
  return (a: CommandAction) =>
    a.label.toLowerCase().includes(q) ||
    a.hint?.toLowerCase().includes(q) ||
    a.keywords?.some((k) => k.includes(q));
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
  today: <Sun className="size-3.5" />,
  calendar: <CalendarDays className="size-3.5" />,
  due: <CalendarClock className="size-3.5" />,
  export: <Download className="size-3.5" />,
  import: <Upload className="size-3.5" />,
  hash: <Hash className="size-3.5" />,
  keyboard: <Keyboard className="size-3.5" />,
  network: <Network className="size-3.5" />,
  share: <Share2 className="size-3.5" />,
};
