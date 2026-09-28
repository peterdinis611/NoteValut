"use client";

import Fuse from "fuse.js";
import {
  CalendarDays,
  FileText,
  FolderOpen,
  LayoutTemplate,
  Link2,
  Network,
  Search,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { removeCustomTemplate } from "@/db/templates-collection";
import { useCustomTemplates } from "@/hooks/use-custom-templates";
import { AnimePresence } from "@/lib/anime-ui";
import { PAGE_TEMPLATES } from "@/lib/templates";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreateEntry: (templateId: string) => void;
  onCreateCollection: () => void;
  onBrowseTemplates?: () => void;
  onQuickCapture?: () => void;
  onOpenToday?: () => void;
  onOpenGraph?: () => void;
  onLinkDocuments?: () => void;
};

type CreateItem = {
  id: string;
  group: "actions" | "yours" | "templates";
  title: string;
  description: string;
  keywords: string[];
  icon: ReactNode;
  run: () => void;
  removable?: boolean;
  onRemove?: () => void;
};

const GROUP_LABEL: Record<CreateItem["group"], string> = {
  actions: "Create new",
  yours: "Your templates",
  templates: "Default templates",
};

export function CreateMenu({
  open,
  onClose,
  onCreateEntry,
  onCreateCollection,
  onBrowseTemplates,
  onQuickCapture,
  onOpenToday,
  onOpenGraph,
  onLinkDocuments,
}: Props) {
  const custom = useCustomTemplates();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const items = useMemo<CreateItem[]>(() => {
    const closeAnd = (fn: () => void) => () => {
      fn();
      onClose();
    };

    const actions: CreateItem[] = [
      {
        id: "action-blank",
        group: "actions",
        title: "Blank page",
        description: "Empty entry in the vault root",
        keywords: ["page", "note", "new", "empty"],
        icon: <FileText className="size-4 text-accent" />,
        run: closeAnd(() => onCreateEntry("blank")),
      },
      {
        id: "action-collection",
        group: "actions",
        title: "Collection",
        description: "Folder to organize entries",
        keywords: ["folder", "database", "group"],
        icon: <FolderOpen className="size-4 text-accent" />,
        run: closeAnd(onCreateCollection),
      },
    ];

    if (onQuickCapture) {
      actions.push({
        id: "action-capture",
        group: "actions",
        title: "Quick capture",
        description: "Inbox note — rules apply on save",
        keywords: ["inbox", "capture", "flash", "zap"],
        icon: <Zap className="size-4 text-accent" />,
        run: closeAnd(onQuickCapture),
      });
    }

    if (onOpenToday) {
      actions.push({
        id: "action-today",
        group: "actions",
        title: "Today’s note",
        description: "Open or create today’s daily page",
        keywords: ["daily", "journal", "calendar", "today"],
        icon: <CalendarDays className="size-4 text-accent" />,
        run: closeAnd(onOpenToday),
      });
    }

    if (onBrowseTemplates) {
      actions.push({
        id: "action-browse",
        group: "actions",
        title: "Browse templates",
        description: "Marketplace of page starters",
        keywords: ["marketplace", "gallery", "starter"],
        icon: <LayoutTemplate className="size-4 text-accent" />,
        run: closeAnd(onBrowseTemplates),
      });
    }

    if (onLinkDocuments) {
      actions.push({
        id: "action-link-docs",
        group: "actions",
        title: "Link documents",
        description: "Connect two pages with a vault [[link]]",
        keywords: ["link", "wikilink", "connection", "relate", "pagelink"],
        icon: <Link2 className="size-4 text-accent" />,
        run: closeAnd(onLinkDocuments),
      });
    }

    if (onOpenGraph) {
      actions.push({
        id: "action-graph",
        group: "actions",
        title: "Page graph",
        description: "See & drag connections with React Flow",
        keywords: ["graph", "network", "xyflow", "connections", "map"],
        icon: <Network className="size-4 text-accent" />,
        run: closeAnd(onOpenGraph),
      });
    }

    const yours: CreateItem[] = custom.map((template) => ({
      id: `custom-${template.id}`,
      group: "yours" as const,
      title: template.name,
      description: template.description || "Custom template",
      keywords: [...(template.tags ?? []), "custom"],
      icon: <span className="create-dialog-emoji">{template.icon}</span>,
      run: closeAnd(() => onCreateEntry(template.id)),
      removable: true,
      onRemove: () => removeCustomTemplate(template.id),
    }));

    const templates: CreateItem[] = PAGE_TEMPLATES.map((template) => ({
      id: `tpl-${template.id}`,
      group: "templates" as const,
      title: template.name,
      description: template.description,
      keywords: [...template.tags, "template"],
      icon: <span className="create-dialog-emoji">{template.icon}</span>,
      run: closeAnd(() => onCreateEntry(template.id)),
    }));

    return [...actions, ...yours, ...templates];
  }, [
    custom,
    onBrowseTemplates,
    onClose,
    onCreateCollection,
    onCreateEntry,
    onLinkDocuments,
    onOpenGraph,
    onOpenToday,
    onQuickCapture,
  ]);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: [
          { name: "title", weight: 0.45 },
          { name: "description", weight: 0.25 },
          { name: "keywords", weight: 0.3 },
        ],
        threshold: 0.38,
        ignoreLocation: true,
      }),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return items;
    return fuse.search(q).map((h) => h.item);
  }, [fuse, items, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
      return;
    }
    setActive(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-create-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, filtered]);

  function onInputKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[active];
      if (item) item.run();
    }
  }

  if (typeof document === "undefined") return null;

  const groups = (["actions", "yours", "templates"] as const)
    .map((g) => ({
      id: g,
      label: GROUP_LABEL[g],
      rows: filtered
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => item.group === g),
    }))
    .filter((g) => g.rows.length > 0);

  return createPortal(
    <AnimePresence show={open} kind="overlay">
      <div className="create-dialog-overlay" onClick={onClose} role="presentation">
        <div
          className="create-dialog"
          role="dialog"
          aria-modal
          aria-labelledby="create-dialog-title"
          onClick={(e) => e.stopPropagation()}
        >
            <header className="create-dialog-header">
              <div>
                <h2 id="create-dialog-title" className="create-dialog-title">
                  Create
                </h2>
                <p className="create-dialog-subtitle">Pages, collections, captures &amp; templates</p>
              </div>
              <button
                type="button"
                className="create-dialog-close"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="create-dialog-search">
              <Search className="size-4 text-muted" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search templates & actions…"
                aria-label="Search create options"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="create-dialog-clear"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="create-dialog-list note-scroll" ref={listRef}>
              {groups.length === 0 ? (
                <p className="create-dialog-empty">No matches for “{query.trim()}”</p>
              ) : (
                groups.map((group) => (
                  <section key={group.id} className="create-dialog-group">
                    <p className="create-dialog-label">{group.label}</p>
                    <ul>
                      {group.rows.map(({ item, idx }, localIdx) => (
                        <li
                          key={item.id}
                          className="create-dialog-row-wrap"
                          style={{ animationDelay: `${Math.min(localIdx, 12) * 28}ms` }}
                        >
                          <div className={`create-dialog-row ${active === idx ? "is-active" : ""}`}>
                            <button
                              type="button"
                              className="create-dialog-item"
                              data-create-idx={idx}
                              onMouseEnter={() => setActive(idx)}
                              onClick={() => item.run()}
                            >
                              <span className="create-dialog-icon">{item.icon}</span>
                              <span className="create-dialog-copy">
                                <span className="create-dialog-item-title">{item.title}</span>
                                <span className="create-dialog-item-desc">{item.description}</span>
                              </span>
                            </button>
                            {item.removable && item.onRemove && (
                              <button
                                type="button"
                                className="create-dialog-remove"
                                aria-label={`Delete template ${item.title}`}
                                title="Delete template"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  item.onRemove?.();
                                }}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))
              )}
            </div>

            <footer className="create-dialog-footer">
              <span>
                <kbd>↑↓</kbd> navigate · <kbd>↵</kbd> open · <kbd>esc</kbd> close
              </span>
            </footer>
        </div>
      </div>
    </AnimePresence>,
    document.body,
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
