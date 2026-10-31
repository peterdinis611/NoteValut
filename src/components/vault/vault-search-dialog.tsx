"use client";

import Fuse from "fuse.js";
import {
  CalendarDays,
  CornerDownLeft,
  FileText,
  Folder,
  GitFork,
  HardDrive,
  Home,
  LayoutGrid,
  LayoutTemplate,
  Search,
  Settings,
  Trash2,
  Wrench,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { Note } from "@/domain/note";
import type { Folder as ShelfFolder, Workspace } from "@/domain/shelf";
import { plainTextFromEditorContent } from "@/lib/editor/content";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "cn";

type SearchItem =
  | {
      kind: "page";
      id: string;
      title: string;
      subtitle: string;
      body: string;
      workspaceId: string;
      folderId: string | null;
    }
  | {
      kind: "folder";
      id: string;
      title: string;
      subtitle: string;
      body: string;
      workspaceId: string;
    }
  | {
      kind: "workspace";
      id: string;
      title: string;
      subtitle: string;
      body: string;
    }
  | {
      kind: "action";
      id:
        | "calendar"
        | "pages"
        | "settings"
        | "storage"
        | "lab"
        | "trash"
        | "map"
        | "templates";
      title: string;
      subtitle: string;
      body: string;
    };

function itemIcon(item: SearchItem) {
  if (item.kind === "page") return FileText;
  if (item.kind === "folder") return Folder;
  if (item.kind === "workspace") return LayoutGrid;
  if (item.id === "calendar") return CalendarDays;
  if (item.id === "map") return GitFork;
  if (item.id === "storage") return HardDrive;
  if (item.id === "lab") return Wrench;
  if (item.id === "trash") return Trash2;
  if (item.id === "templates") return LayoutTemplate;
  if (item.id === "settings") return Settings;
  return Home;
}

function kindLabel(item: SearchItem) {
  if (item.kind === "action") return "Jump";
  if (item.kind === "page") return "Page";
  if (item.kind === "folder") return "Folder";
  return "Space";
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-border/80 bg-muted/60 px-1.5 font-mono text-[10px] font-medium tracking-wide text-muted-foreground shadow-[inset_0_-1px_0_oklch(0_0_0/0.12)]">
      {children}
    </kbd>
  );
}

export function VaultSearchDialog({
  open,
  onOpenChange,
  workspaces,
  folders,
  notes,
  onSelectNote,
  onSelectWorkspace,
  onSelectFolder,
  onChangeView,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaces: readonly Workspace[];
  folders: readonly ShelfFolder[];
  notes: readonly Note[];
  onSelectNote: (id: string) => void;
  onSelectWorkspace: (id: string) => void;
  onSelectFolder: (id: string) => void;
  onChangeView: (
    view:
      | "pages"
      | "calendar"
      | "settings"
      | "storage"
      | "lab"
      | "trash"
      | "map"
      | "templates",
  ) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const items = useMemo<SearchItem[]>(() => {
    const workspaceName = (id: string) =>
      workspaces.find((workspace) => workspace.id === id)?.name ?? "Workspace";
    const folderName = (id: string | null) =>
      id
        ? (folders.find((folder) => folder.id === id)?.name ?? "Folder")
        : "Root";

    const pages: SearchItem[] = notes
      .filter((note) => note.deletedAt == null)
      .map((note) => ({
        kind: "page",
        id: note.id,
        title: note.title || "Untitled",
        subtitle: `${workspaceName(note.workspaceId)} · ${folderName(note.folderId)}`,
        body: plainTextFromEditorContent(note.body),
        workspaceId: note.workspaceId,
        folderId: note.folderId,
      }));

    const folderItems: SearchItem[] = folders
      .filter((folder) => folder.deletedAt == null)
      .map((folder) => ({
        kind: "folder",
        id: folder.id,
        title: `${folder.emoji} ${folder.name}`,
        subtitle: workspaceName(folder.workspaceId),
        body: folder.name,
        workspaceId: folder.workspaceId,
      }));

    const workspaceItems: SearchItem[] = workspaces.map((workspace) => ({
      kind: "workspace",
      id: workspace.id,
      title: `${workspace.emoji} ${workspace.name}`,
      subtitle: "Workspace",
      body: workspace.name,
    }));

    const actions: SearchItem[] = [
      {
        kind: "action",
        id: "pages",
        title: "Go to pages",
        subtitle: "Open the writing surface",
        body: "pages home notes",
      },
      {
        kind: "action",
        id: "calendar",
        title: "Go to calendar",
        subtitle: "Schedule and day view",
        body: "calendar schedule events",
      },
      {
        kind: "action",
        id: "map",
        title: "Open structure map",
        subtitle: "Folders and pages as a graph",
        body: "map graph xyflow structure connections",
      },
      {
        kind: "action",
        id: "storage",
        title: "Open storage",
        subtitle: "Upload and arrange vault files",
        body: "storage files upload drag drop bucket",
      },
      {
        kind: "action",
        id: "lab",
        title: "Open lab",
        subtitle: "Developer helpers and widgets",
        body: "lab helpers markdown picsum fixtures tools",
      },
      {
        kind: "action",
        id: "templates",
        title: "Open templates",
        subtitle: "Built-in and custom page starters",
        body: "templates meeting daily brief checklist wiki custom",
      },
      {
        kind: "action",
        id: "trash",
        title: "Open trash",
        subtitle: "Restore or permanently delete",
        body: "trash bin deleted restore",
      },
      {
        kind: "action",
        id: "settings",
        title: "Open settings",
        subtitle: "Theme, writing, workspace, alerts",
        body: "settings preferences theme workspace privacy",
      },
    ];

    return [...pages, ...folderItems, ...workspaceItems, ...actions];
  }, [folders, notes, workspaces]);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: [
          { name: "title", weight: 0.55 },
          { name: "subtitle", weight: 0.2 },
          { name: "body", weight: 0.25 },
        ],
        threshold: 0.38,
        ignoreLocation: true,
        includeScore: true,
      }),
    [items],
  );

  const results = useMemo(() => {
    const trimmed = query.trim();
    const matched = !trimmed
      ? items
          .filter((item) => item.kind === "page" || item.kind === "action")
          .slice(0, 10)
      : fuse.search(trimmed).slice(0, 12).map((hit) => hit.item);

    // Keep keyboard order aligned with grouped UI: vault items, then jumps.
    const shelves = matched.filter((item) => item.kind !== "action");
    const jumps = matched.filter((item) => item.kind === "action");
    return [...shelves, ...jumps];
  }, [fuse, items, query]);

  const grouped = useMemo(() => {
    const shelves = results.filter((item) => item.kind !== "action");
    const jumps = results.filter((item) => item.kind === "action");
    return { shelves, jumps };
  }, [results]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const select = (item: SearchItem) => {
    if (item.kind === "page") {
      onSelectWorkspace(item.workspaceId);
      if (item.folderId) onSelectFolder(item.folderId);
      onSelectNote(item.id);
      onChangeView("pages");
    } else if (item.kind === "folder") {
      onSelectWorkspace(item.workspaceId);
      onSelectFolder(item.id);
      onChangeView("pages");
    } else if (item.kind === "workspace") {
      onSelectWorkspace(item.id);
      onChangeView("pages");
    } else {
      onChangeView(item.id);
    }
    onOpenChange(false);
  };

  const renderRow = (item: SearchItem, index: number) => {
    const Icon = itemIcon(item);
    const active = index === activeIndex;

    return (
      <motion.li
        key={`${item.kind}-${item.id}`}
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.18,
          delay: reduceMotion ? 0 : Math.min(index, 8) * 0.02,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <button
          type="button"
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => select(item)}
          className={cn(
            "group relative flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left transition-[background,box-shadow,transform] duration-150",
            active
              ? "bg-accent text-accent-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_22%,transparent)]"
              : "hover:bg-muted/70",
          )}
        >
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-[8px] border text-muted-foreground transition-colors",
              active
                ? "border-primary/25 bg-background/70 text-foreground"
                : "border-border/70 bg-muted/50 group-hover:border-border group-hover:bg-background/60",
            )}
          >
            <Icon className="size-3.5 stroke-[1.75]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium tracking-[-0.01em]">
              {item.title}
            </span>
            <span
              className={cn(
                "mt-0.5 block truncate text-[12px]",
                active ? "text-accent-foreground/70" : "text-muted-foreground",
              )}
            >
              {item.subtitle}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "hidden font-mono text-[9px] tracking-[0.16em] uppercase sm:inline",
                active
                  ? "text-accent-foreground/55"
                  : "text-muted-foreground/70",
              )}
            >
              {kindLabel(item)}
            </span>
            {active ? (
              <span className="flex size-6 items-center justify-center rounded-[6px] bg-background/55 text-foreground/70">
                <CornerDownLeft className="size-3" />
              </span>
            ) : null}
          </span>
        </button>
      </motion.li>
    );
  };

  const shelfStart = 0;
  const jumpStart = grouped.shelves.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[14%] w-[min(100%-1.5rem,36rem)] translate-y-0 gap-0 overflow-hidden rounded-[16px] border-0 bg-popover/95 p-0 shadow-[0_28px_80px_-28px_oklch(0_0_0/0.55),0_0_0_1px_color-mix(in_oklch,var(--border)_80%,transparent)] ring-0 backdrop-blur-xl sm:max-w-xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search vault</DialogTitle>
          <DialogDescription>
            Find pages, folders, and workspaces with fuzzy search.
          </DialogDescription>
        </DialogHeader>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 55% at 12% -10%, color-mix(in oklch, var(--primary) 16%, transparent), transparent 55%), radial-gradient(ellipse 55% 40% at 100% 0%, color-mix(in oklch, var(--accent) 35%, transparent), transparent 50%)",
          }}
        />

        <div className="relative border-b border-border/70 px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 rounded-[12px] border border-border/80 bg-background/55 px-3 shadow-[inset_0_1px_0_color-mix(in_oklch,var(--foreground)_6%,transparent)]">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pages, folders, workspaces…"
              className="h-12 w-full bg-transparent text-[15px] tracking-[-0.01em] text-foreground outline-none placeholder:text-muted-foreground/70"
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveIndex((index) =>
                    Math.min(index + 1, Math.max(results.length - 1, 0)),
                  );
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveIndex((index) => Math.max(index - 1, 0));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  const item = results[activeIndex];
                  if (item) select(item);
                }
              }}
            />
            <Kbd>esc</Kbd>
          </div>
          <p className="mt-2.5 px-0.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground/70 uppercase">
            {query.trim()
              ? `${results.length} match${results.length === 1 ? "" : "es"}`
              : "Recent pages · quick jumps"}
          </p>
        </div>

        <ScrollArea className="relative max-h-[min(54vh,440px)]">
          <div className="px-2.5 py-2.5">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <span className="flex size-11 items-center justify-center rounded-[12px] border border-dashed border-border bg-muted/40 text-muted-foreground">
                  <Search className="size-4" />
                </span>
                <p className="mt-4 font-display text-lg tracking-tight text-foreground">
                  Nothing found
                </p>
                <p className="mt-1 max-w-[16rem] text-[13px] text-muted-foreground">
                  No matches for “{query.trim()}”. Try a page title or folder
                  name.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <ul className="space-y-3">
                  {grouped.shelves.length > 0 ? (
                    <li>
                      <p className="mb-1.5 px-2.5 font-mono text-[10px] tracking-[0.16em] text-muted-foreground/75 uppercase">
                        In your vault
                      </p>
                      <ul className="space-y-0.5">
                        {grouped.shelves.map((item, index) =>
                          renderRow(item, shelfStart + index),
                        )}
                      </ul>
                    </li>
                  ) : null}
                  {grouped.jumps.length > 0 ? (
                    <li>
                      <p className="mb-1.5 px-2.5 font-mono text-[10px] tracking-[0.16em] text-muted-foreground/75 uppercase">
                        Jump to
                      </p>
                      <ul className="space-y-0.5">
                        {grouped.jumps.map((item, index) =>
                          renderRow(item, jumpStart + index),
                        )}
                      </ul>
                    </li>
                  ) : null}
                </ul>
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>

        <div className="relative flex items-center justify-between gap-3 border-t border-border/70 bg-muted/25 px-4 py-2.5 text-[11px] text-muted-foreground">
          <span className="truncate tracking-wide">
            Fuzzy search across the shelf
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <span className="mx-0.5 text-muted-foreground/50">to move</span>
            <Kbd>
              <CornerDownLeft className="size-2.5" />
            </Kbd>
            <span className="text-muted-foreground/50">open</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
