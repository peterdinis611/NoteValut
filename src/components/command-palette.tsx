"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useQuery } from "convex/react";
import {
  Archive,
  CalendarClock,
  CalendarDays,
  Clock,
  Download,
  Focus,
  FolderOpen,
  Hash,
  Home,
  Inbox,
  Keyboard,
  LayoutTemplate,
  Network,
  Paperclip,
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
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { isFolder } from "@/lib/item-kinds";
import { searchNotes, type NoteSearchHit } from "@/lib/search";
import { semanticSearch } from "@/lib/semantic-search";
import {
  highlightMatches,
  noteMatchesFilters,
  parseSearchFilters,
} from "@/lib/search-highlight";
import {
  getRecentSearches,
  getServerRecentSearches,
  rememberSearch,
  subscribeRecentSearches,
} from "@/lib/cmd-recent";
import { AnimePresence } from "@/lib/anime-ui";
import { snippetAround } from "@/lib/block-search";
import { blocksToSearchText } from "@/lib/block-search";

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

function Highlighted({ text, query }: { text: string; query: string }) {
  const parts = highlightMatches(text, query);
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="cmd-mark">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

function useRecentSearches() {
  return useSyncExternalStore(subscribeRecentSearches, getRecentSearches, getServerRecentSearches);
}

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
  const recent = useRecentSearches();

  const q = debouncedQuery.trim();
  const filters = useMemo(() => parseSearchFilters(q), [q]);
  const qLower = q.toLowerCase();
  const tagQuery = qLower.startsWith("#") ? qLower.slice(1).trim() : filters.tags[0] ?? "";
  const searchBare = filters.bareQuery || (q.startsWith("#") ? "" : q);

  const serverHits = useQuery(
    api.notes.search,
    open && ownerId && searchBare.length >= 2 && !q.startsWith("#")
      ? { ownerId, query: searchBare, limit: 24 }
      : "skip",
  );
  const tagRows = useQuery(api.notes.listTags, open && ownerId ? { ownerId } : "skip");

  useEffect(() => {
    if (!open) {
      setQuery("");
      setIndex(0);
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  const noteHits: NoteSearchHit[] = useMemo(() => {
    if (!notes || q.startsWith("#")) return [];
    const pool = notes.filter((n) => !isFolder(n) && noteMatchesFilters(n, filters));
    if (!searchBare && !filters.tags.length && !filters.after && !filters.before) {
      return pool.slice(0, 8);
    }
    let hits: NoteSearchHit[] = [];
    if (searchBare.length >= 2 && serverHits !== undefined && serverHits.length > 0) {
      hits = serverHits
        .filter((n) => noteMatchesFilters(n, filters))
        .map((n) => {
          const body = [n.content, blocksToSearchText(n.blocks)].filter(Boolean).join("\n");
          return {
            ...n,
            snippet: snippetAround(body, searchBare) || snippetAround(n.title || "", searchBare),
          };
        });
    } else if (searchBare) {
      hits = searchNotes(pool, searchBare).slice(0, 12);
    } else {
      hits = pool.slice(0, 12);
    }
    return hits.slice(0, 12);
  }, [notes, q, serverHits, filters, searchBare]);

  const actionHits = useMemo(() => {
    if (!qLower || q.startsWith("#") || filters.tags.length || filters.after || filters.before) {
      return q.startsWith("#") || filters.tags.length ? [] : q ? actions.filter(matchAction(qLower)) : actions;
    }
    return actions.filter(matchAction(qLower));
  }, [actions, q, qLower, filters.tags.length, filters.after, filters.before]);

  const tagHits = useMemo(() => {
    if (!tagRows?.length || !onOpenTag) return [];
    const showAll = !q || q.startsWith("#") || qLower.includes("tag") || filters.tags.length > 0;
    if (!showAll && tagQuery.length < 1) return [];
    const filtered = tagRows.filter((t) => {
      if (!tagQuery) return q.startsWith("#") || !q;
      return t.tag.toLowerCase().includes(tagQuery) || t.key.includes(tagQuery);
    });
    return filtered.slice(0, q.startsWith("#") ? 16 : 6);
  }, [tagRows, tagQuery, q, qLower, onOpenTag, filters.tags.length]);

  type Row =
    | { kind: "recent"; q: string }
    | { kind: "action"; action: CommandAction }
    | { kind: "tag"; tag: string; count: number }
    | { kind: "note"; note: NoteSearchHit }
    | { kind: "semantic"; note: NoteSearchHit; score: number };

  const semanticHits = useMemo(() => {
    if (!notes || searchBare.length < 3 || q.startsWith("#")) return [];
    const pool = notes.filter((n) => !isFolder(n) && noteMatchesFilters(n, filters));
    const ftsIds = new Set(noteHits.map((n) => n._id));
    return semanticSearch(pool, searchBare, 8)
      .filter((h) => !ftsIds.has(h.note._id))
      .map((h) => {
        const body = [h.note.content, blocksToSearchText(h.note.blocks)]
          .filter(Boolean)
          .join("\n");
        return {
          note: {
            ...h.note,
            snippet:
              snippetAround(body, searchBare) ||
              snippetAround(h.note.title || "", searchBare) ||
              null,
          } as NoteSearchHit,
          score: h.score,
        };
      });
  }, [notes, searchBare, q, filters, noteHits]);

  const showRecent = open && !q && recent.length > 0;

  const rows: Row[] = useMemo(() => {
    const list: Row[] = [];
    if (showRecent) {
      for (const r of recent) list.push({ kind: "recent", q: r.q });
    }
    for (const action of actionHits) list.push({ kind: "action", action });
    for (const t of tagHits) list.push({ kind: "tag", tag: t.tag, count: t.count });
    for (const note of noteHits) list.push({ kind: "note", note });
    for (const hit of semanticHits) list.push({ kind: "semantic", note: hit.note, score: hit.score });
    return list;
  }, [actionHits, tagHits, noteHits, semanticHits, showRecent, recent]);

  useEffect(() => {
    setIndex(0);
  }, [debouncedQuery, open]);

  function commitNavigate(noteId: Id<"notes">) {
    if (q.trim().length >= 2) rememberSearch(q.trim());
    onNavigate(noteId);
    onClose();
  }

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
        if (row.kind === "recent") {
          setQuery(row.q);
          return;
        }
        if (row.kind === "action") {
          row.action.run();
          onClose();
        } else if (row.kind === "tag") {
          onOpenTag?.(row.tag);
          onClose();
        } else if (row.kind === "note" || row.kind === "semantic") {
          commitNavigate(row.note._id);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, rows, index, onClose, onNavigate, onOpenTag, q]);

  const ftsPending = searchBare.length >= 2 && !q.startsWith("#") && serverHits === undefined;
  const highlightQ = searchBare || tagQuery;

  return (
    <AnimePresence show={open} kind="overlay">
      <div className="cmd-overlay" onClick={onClose}>
        <div
          className="cmd-palette"
          role="dialog"
          aria-modal
          aria-label="Command palette"
          onClick={(e) => e.stopPropagation()}
        >
            <div className="cmd-input-row">
              <Search className="size-4 text-muted" />
              <input
                ref={inputRef}
                className="cmd-input"
                placeholder="Search · #tag · tag:work after:2026-01-01 · commands…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd className="cmd-kbd">esc</kbd>
            </div>
            <p className="cmd-hint">
              Filters: <span>tag:</span> <span>after:</span> <span>before:</span> · ↑↓ enter · ⌘K
              {ftsPending ? " · searching…" : ""}
            </p>

            {(filters.tags.length > 0 || filters.after || filters.before) && (
              <div className="cmd-filters">
                {filters.tags.map((t) => (
                  <span key={t} className="cmd-filter-chip">
                    tag:{t}
                  </span>
                ))}
                {filters.after ? (
                  <span className="cmd-filter-chip">after:{filters.after}</span>
                ) : null}
                {filters.before ? (
                  <span className="cmd-filter-chip">before:{filters.before}</span>
                ) : null}
              </div>
            )}

            <div className="cmd-list note-scroll">
              {rows.length === 0 ? (
                <p className="cmd-empty">No matches</p>
              ) : (
                rows.map((row, i) => {
                  if (row.kind === "recent") {
                    const showSection = i === 0;
                    return (
                      <div key={`r-${row.q}-${i}`}>
                        {showSection && <p className="cmd-section">Recent searches</p>}
                        <button
                          type="button"
                          className={`cmd-row ${i === index ? "cmd-row-active" : ""}`}
                          onMouseEnter={() => setIndex(i)}
                          onClick={() => setQuery(row.q)}
                        >
                          <span className="cmd-row-icon">
                            <Clock className="size-3.5" />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-left text-sm">{row.q}</span>
                        </button>
                      </div>
                    );
                  }
                  if (row.kind === "action") {
                    const showSection = i === (showRecent ? recent.length : 0);
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
                            <span className="block truncate text-sm">
                              <Highlighted text={row.action.label} query={highlightQ} />
                            </span>
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
                      i === (showRecent ? recent.length : 0) + actionHits.length ||
                      ((showRecent ? recent.length : 0) + actionHits.length === 0 && i === 0);
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
                            <span className="block truncate text-sm">
                              #<Highlighted text={row.tag} query={highlightQ} />
                            </span>
                            <span className="block truncate text-xs text-muted">
                              {row.count} {row.count === 1 ? "note" : "notes"}
                            </span>
                          </span>
                        </button>
                      </div>
                    );
                  }
                  const noteStart =
                    (showRecent ? recent.length : 0) + actionHits.length + tagHits.length;
                  const showSection = i === noteStart;
                  if (row.kind === "semantic") {
                    const semanticStart = noteStart + noteHits.length;
                    const showSemanticSection = i === semanticStart;
                    return (
                      <div key={`s-${row.note._id}`}>
                        {showSemanticSection && <p className="cmd-section">Semantic</p>}
                        <button
                          type="button"
                          className={`cmd-row ${i === index ? "cmd-row-active" : ""}`}
                          onMouseEnter={() => setIndex(i)}
                          onClick={() => commitNavigate(row.note._id)}
                        >
                          <span className="cmd-row-icon text-base">{row.note.icon}</span>
                          <span className="min-w-0 flex-1 text-left">
                            <span className="block truncate text-sm">
                              <Highlighted
                                text={row.note.title || "Untitled"}
                                query={highlightQ}
                              />
                            </span>
                            {row.note.snippet ? (
                              <span className="block truncate text-xs text-muted cmd-snippet">
                                <Highlighted text={row.note.snippet} query={highlightQ} />
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div key={`n-${row.note._id}`}>
                      {showSection && <p className="cmd-section">Notes</p>}
                      <button
                        type="button"
                        className={`cmd-row ${i === index ? "cmd-row-active" : ""}`}
                        onMouseEnter={() => setIndex(i)}
                        onClick={() => commitNavigate(row.note._id)}
                      >
                        <span className="cmd-row-icon text-base">{row.note.icon}</span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-sm">
                            <Highlighted
                              text={row.note.title || "Untitled"}
                              query={highlightQ}
                            />
                          </span>
                          {row.note.snippet ? (
                            <span className="block truncate text-xs text-muted cmd-snippet">
                              <Highlighted text={row.note.snippet} query={highlightQ} />
                            </span>
                          ) : row.note.tags.length > 0 ? (
                            <span className="block truncate text-xs text-muted">
                              {row.note.tags.map((t) => `#${t}`).join(" ")}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
        </div>
      </div>
    </AnimePresence>
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
  attachments: <Paperclip className="size-3.5" />,
  templates: <LayoutTemplate className="size-3.5" />,
  inbox: <Inbox className="size-3.5" />,
  focus: <Focus className="size-3.5" />,
};
