"use client";

import { useMutation, useQuery } from "convex/react";
import { useDebouncedValue } from "@tanstack/react-pacer";
import {
  Archive,
  ChevronDown,
  ChevronRight,
  Clock3,
  FolderOpen,
  Home,
  PanelLeftClose,
  Pin,
  Plus,
  Search,
  Settings2,
  Share2,
  Sparkles,
  StickyNote,
  Tag,
  Trash2,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { getLabelColor } from "@/lib/colors";
import { useCustomTemplates } from "@/hooks/use-custom-templates";
import { isFolder } from "@/lib/item-kinds";
import { easeOutSoft, sidebarVariants } from "@/lib/motion";
import { searchNotes } from "@/lib/search";
import { PAGE_TEMPLATES } from "@/lib/templates";
import { CreateMenu } from "./create-menu";
import { SharePanel } from "./share-panel";
import { useToast } from "./toast";
import { VirtualList } from "./virtual-list";

type BrowseMode =
  | "vault"
  | "favorites"
  | "recent"
  | "collections"
  | "pages"
  | "archive";

type Props = {
  ownerId: string;
  activeId: Id<"notes"> | null;
  settingsActive?: boolean;
  tagsActive?: boolean;
  onSelect: (id: Id<"notes"> | null) => void;
  onGoHome: () => void;
  onOpenSettings?: () => void;
  onOpenTags?: () => void;
  onCollapse: () => void;
  onCreateEntry: (parentId?: Id<"notes">, templateId?: string) => void;
  onCreateCollection: (parentId?: Id<"notes">) => void;
  onQuickCapture: () => void;
};

export function Sidebar({
  ownerId,
  activeId,
  settingsActive = false,
  tagsActive = false,
  onSelect,
  onGoHome,
  onOpenSettings,
  onOpenTags,
  onCollapse,
  onCreateEntry,
  onCreateCollection,
  onQuickCapture,
}: Props) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [debouncedSearch, searchDebouncer] = useDebouncedValue(search, { wait: 200 }, (state) => ({
    isPending: state.isPending,
  }));
  const [showBin, setShowBin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [browse, setBrowse] = useState<BrowseMode>("vault");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const customTemplates = useCustomTemplates();

  const notes = useQuery(api.notes.list, { ownerId });
  const trashed = useQuery(api.notes.listTrashed, { ownerId });
  const archived = useQuery(api.notes.listArchived, { ownerId });

  const updateNote = useMutation(api.notes.update);
  const trashNote = useMutation(api.notes.trash);
  const restoreNote = useMutation(api.notes.restoreFromTrash);
  const emptyTrash = useMutation(api.notes.emptyTrash);

  async function handleTrash(id: Id<"notes">) {
    try {
      await trashNote({ id });
      toast.success("Moved to bin");
    } catch {
      toast.error("Couldn’t move to bin");
    }
  }

  async function handleRestore(id: Id<"notes">) {
    try {
      await restoreNote({ id });
      toast.success("Restored from bin");
    } catch {
      toast.error("Couldn’t restore item");
    }
  }

  async function handleEmptyTrash() {
    try {
      await emptyTrash({ ownerId });
      toast.success("Bin emptied");
      setShowBin(false);
    } catch {
      toast.error("Couldn’t empty bin");
    }
  }

  async function handleTogglePin(id: Id<"notes">, pinned: boolean) {
    try {
      await updateNote({ id, pinned: !pinned });
      toast.success(pinned ? "Removed from favorites" : "Added to favorites");
    } catch {
      toast.error("Couldn’t update favorite");
    }
  }

  async function handleUnarchive(id: Id<"notes">) {
    try {
      await updateNote({ id, archived: false });
      toast.success("Restored from archive");
    } catch {
      toast.error("Couldn’t unarchive");
    }
  }

  const isSearching = !!search.trim();
  const searchPending = isSearching && searchDebouncer.state.isPending;
  const activeItems = useMemo(() => notes ?? [], [notes]);
  const searchResults = useMemo(
    () => searchNotes(activeItems, debouncedSearch),
    [activeItems, debouncedSearch],
  );
  const pinned = useMemo(() => activeItems.filter((n) => n.pinned), [activeItems]);
  const collections = useMemo(
    () => activeItems.filter((n) => isFolder(n) && !n.parentId),
    [activeItems],
  );
  const pages = useMemo(
    () => activeItems.filter((n) => !isFolder(n) && !n.parentId),
    [activeItems],
  );
  const recent = useMemo(
    () =>
      [...activeItems]
        .filter((n) => !isFolder(n))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 12),
    [activeItems],
  );
  const archivedItems = useMemo(() => archived ?? [], [archived]);

  const childrenByParent = useMemo(() => {
    const map = new Map<string, Doc<"notes">[]>();
    for (const note of activeItems) {
      const key = note.parentId ?? "root";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(note);
    }
    for (const [, list] of map) {
      list.sort((a, b) => {
        if (isFolder(a) !== isFolder(b)) return isFolder(a) ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
    }
    return map;
  }, [activeItems]);

  const rootItems = childrenByParent.get("root") ?? [];
  const trashCount = trashed?.length ?? 0;
  const homeActive =
    activeId === null &&
    !settingsActive &&
    !tagsActive &&
    !isSearching &&
    browse === "vault" &&
    !showBin;

  function setBrowseMode(mode: BrowseMode) {
    setShowBin(false);
    setBrowse(mode);
    if (mode === "vault") onGoHome();
  }

  return (
    <motion.aside
      className="sidebar"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={easeOutSoft}
    >
      <div className="sidebar-header">
        <button type="button" className="sidebar-workspace" onClick={onGoHome}>
          <span className="sidebar-mark" aria-hidden>
            N
          </span>
          <span className="sidebar-brand">NoteVault</span>
        </button>
        <button
          type="button"
          className="sidebar-icon-btn"
          onClick={onCollapse}
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="size-4" />
        </button>
      </div>

      <div className={`sidebar-search-wrap ${searchPending ? "sidebar-search-pending" : ""}`}>
        <Search className="sidebar-search-icon" />
        <input
          className="sidebar-search"
          placeholder="Search vault…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-busy={searchPending}
        />
      </div>

      <div className="sidebar-quick">
        <button
          type="button"
          className={`sidebar-nav-btn ${homeActive ? "sidebar-nav-btn-active" : ""}`}
          onClick={() => {
            setBrowse("vault");
            setShowBin(false);
            onGoHome();
          }}
        >
          <Home className="size-3.5" />
          Home
        </button>
        <button
          type="button"
          data-create-trigger
          className="sidebar-nav-btn sidebar-nav-btn-accent"
          onClick={() => setShowCreate((v) => !v)}
        >
          <Plus className="size-3.5" />
          New
        </button>
        <CreateMenu
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreateEntry={(templateId) => onCreateEntry(undefined, templateId)}
          onCreateCollection={() => onCreateCollection()}
        />
      </div>

      <div className="sidebar-shortcuts">
        {(
          [
            { id: "vault", label: "Vault", icon: StickyNote, count: rootItems.length },
            { id: "favorites", label: "Favorites", icon: Pin, count: pinned.length },
            { id: "recent", label: "Recent", icon: Clock3, count: recent.length },
            { id: "collections", label: "Collections", icon: FolderOpen, count: collections.length },
            { id: "pages", label: "Pages", icon: StickyNote, count: pages.length },
            { id: "archive", label: "Archive", icon: Archive, count: archivedItems.length },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = !isSearching && !showBin && !tagsActive && browse === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-shortcut ${active ? "sidebar-shortcut-active" : ""}`}
              onClick={() => setBrowseMode(item.id)}
            >
              <Icon className="size-3.5" />
              <span className="sidebar-shortcut-label">{item.label}</span>
              <span className="sidebar-shortcut-count">{item.count}</span>
            </button>
          );
        })}
      </div>

      <div className="sidebar-templates">
        <p className="sidebar-templates-label">
          <Sparkles className="size-3" />
          Quick start
        </p>
        <div className="sidebar-templates-row">
          {[
            ...customTemplates.slice(0, 3),
            ...PAGE_TEMPLATES.filter((t) => t.id !== "blank"),
          ]
            .slice(0, 5)
            .map((template) => (
              <button
                key={template.id}
                type="button"
                className="sidebar-template-chip"
                title={template.description}
                onClick={() => onCreateEntry(undefined, template.id)}
              >
                <span>{template.icon}</span>
                <span className="truncate">{template.name}</span>
              </button>
            ))}
        </div>
      </div>

      <nav className="sidebar-nav note-scroll">
        {notes === undefined ? (
          <p className="sidebar-empty">Loading…</p>
        ) : isSearching ? (
          <SidebarSection
            title={searchPending ? "Searching…" : `Results · ${searchResults.length}`}
          >
            {searchResults.length === 0 ? (
              <p className="sidebar-empty">No matches</p>
            ) : (
              <VirtualList
                items={searchResults}
                estimateSize={36}
                overscan={10}
                className="sidebar-virtual"
                getKey={(item) => item._id}
                renderItem={(item) => (
                  <SidebarItem
                    item={item}
                    active={item._id === activeId}
                    onSelect={() => onSelect(item._id)}
                    onTogglePin={() => handleTogglePin(item._id, item.pinned)}
                    onTrash={() => handleTrash(item._id)}
                  />
                )}
              />
            )}
          </SidebarSection>
        ) : browse === "favorites" ? (
          <SidebarSection title="Favorites">
            {pinned.length === 0 ? (
              <EmptyHint text="Pin entries to keep them here." />
            ) : (
              <VirtualNoteList
                items={pinned}
                activeId={activeId}
                onSelect={onSelect}
                onTogglePin={handleTogglePin}
                onTrash={handleTrash}
              />
            )}
          </SidebarSection>
        ) : browse === "recent" ? (
          <SidebarSection title="Recently edited">
            {recent.length === 0 ? (
              <EmptyHint text="Edited pages show up here." />
            ) : (
              <VirtualNoteList
                items={recent}
                activeId={activeId}
                onSelect={onSelect}
                onTogglePin={handleTogglePin}
                onTrash={handleTrash}
              />
            )}
          </SidebarSection>
        ) : browse === "collections" ? (
          <SidebarSection title="Collections">
            <button
              type="button"
              className="sidebar-inline-cta"
              onClick={() => onCreateCollection()}
            >
              <Plus className="size-3.5" />
              New collection
            </button>
            {collections.length === 0 ? (
              <EmptyHint text="Group related pages into collections." />
            ) : (
              <VirtualNoteList
                items={collections}
                activeId={activeId}
                onSelect={onSelect}
                onTogglePin={handleTogglePin}
                onTrash={handleTrash}
              />
            )}
          </SidebarSection>
        ) : browse === "pages" ? (
          <SidebarSection title="Pages">
            <button
              type="button"
              className="sidebar-inline-cta"
              onClick={() => onCreateEntry()}
            >
              <Plus className="size-3.5" />
              New page
            </button>
            {pages.length === 0 ? (
              <EmptyHint text="Top-level pages live here." />
            ) : (
              <VirtualNoteList
                items={pages}
                activeId={activeId}
                onSelect={onSelect}
                onTogglePin={handleTogglePin}
                onTrash={handleTrash}
              />
            )}
          </SidebarSection>
        ) : browse === "archive" ? (
          <SidebarSection title="Archive">
            {archived === undefined ? (
              <p className="sidebar-empty">Loading…</p>
            ) : archivedItems.length === 0 ? (
              <EmptyHint text="Archived pages show up here." />
            ) : (
              <ul className="sidebar-section-items">
                {archivedItems.map((item) => (
                  <li key={item._id} className="sidebar-bin-item">
                    <button
                      type="button"
                      className="sidebar-bin-label min-w-0 flex-1 text-left"
                      onClick={() => onSelect(item._id)}
                    >
                      <span>{item.icon}</span>
                      <span className="truncate">{item.title || "Untitled"}</span>
                    </button>
                    <button
                      type="button"
                      className="sidebar-bin-restore"
                      onClick={() => void handleUnarchive(item._id)}
                    >
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SidebarSection>
        ) : (
          <SidebarSection
            title="Vault"
            action={
              <button
                type="button"
                className="sidebar-section-action"
                onClick={() => onCreateEntry()}
                aria-label="New entry"
              >
                <Plus className="size-3.5" />
              </button>
            }
          >
            {rootItems.length === 0 ? (
              <div className="sidebar-empty-state">
                <p className="sidebar-empty-title">Nothing here yet</p>
                <p className="sidebar-empty-copy">
                  {trashCount > 0
                    ? `${trashCount} item${trashCount === 1 ? "" : "s"} in the bin — restore or create new.`
                    : "Create an entry or collection to get started."}
                </p>
                <div className="sidebar-empty-actions">
                  <button
                    type="button"
                    className="sidebar-empty-cta"
                    onClick={() => onCreateEntry()}
                  >
                    <Plus className="size-3.5" />
                    Entry
                  </button>
                  <button
                    type="button"
                    className="sidebar-empty-cta"
                    onClick={() => onCreateCollection()}
                  >
                    <FolderOpen className="size-3.5" />
                    Collection
                  </button>
                </div>
              </div>
            ) : (
              <ul className="sidebar-tree">
                {rootItems.map((item) => (
                  <TreeNode
                    key={item._id}
                    item={item}
                    depth={0}
                    activeId={activeId}
                    childrenByParent={childrenByParent}
                    expanded={expanded}
                    onToggleExpanded={(id, next) =>
                      setExpanded((e) => ({ ...e, [id]: next }))
                    }
                    onSelect={onSelect}
                    onCreateEntry={onCreateEntry}
                    onCreateCollection={onCreateCollection}
                    onTogglePin={handleTogglePin}
                    onTrash={handleTrash}
                  />
                ))}
              </ul>
            )}
          </SidebarSection>
        )}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-footer-btn" onClick={onQuickCapture}>
          <Zap className="size-3.5" />
          <span className="flex-1 text-left">Quick capture</span>
        </button>
        {onOpenSettings && (
          <button
            type="button"
            className={`sidebar-footer-btn ${settingsActive ? "sidebar-footer-btn-open" : ""}`}
            onClick={() => {
              setShowBin(false);
              onOpenSettings();
            }}
          >
            <Settings2 className="size-3.5" />
            <span className="flex-1 text-left">Settings</span>
          </button>
        )}
        {onOpenTags && (
          <button
            type="button"
            className={`sidebar-footer-btn ${tagsActive ? "sidebar-footer-btn-open" : ""}`}
            onClick={() => {
              setShowBin(false);
              onOpenTags();
            }}
          >
            <Tag className="size-3.5" />
            <span className="flex-1 text-left">Tags</span>
          </button>
        )}
        <button
          type="button"
          className="sidebar-footer-btn"
          onClick={() => setShowShare(true)}
        >
          <Share2 className="size-3.5" />
          <span className="flex-1 text-left">Share vault</span>
        </button>
        <button
          type="button"
          className={`sidebar-footer-btn ${showBin ? "sidebar-footer-btn-open" : ""}`}
          onClick={() => setShowBin((v) => !v)}
        >
          <Trash2 className="size-3.5" />
          <span className="flex-1 text-left">Bin</span>
          {trashCount > 0 && <span className="sidebar-count">{trashCount}</span>}
        </button>
        {showBin && (
          <div className="sidebar-bin">
            {trashCount === 0 ? (
              <p className="sidebar-empty">Bin is empty</p>
            ) : (
              <>
                {trashed?.map((item) => (
                  <div key={item._id} className="sidebar-bin-item">
                    <span className="sidebar-bin-label">
                      <span>{item.icon}</span>
                      <span className="truncate">{item.title || "Untitled"}</span>
                    </span>
                    <button
                      type="button"
                      className="sidebar-bin-restore"
                      onClick={() => handleRestore(item._id)}
                    >
                      Restore
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="sidebar-empty-bin"
                  onClick={handleEmptyTrash}
                >
                  Empty bin
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <SharePanel
        ownerId={ownerId}
        open={showShare}
        onClose={() => setShowShare(false)}
        scope="vault"
        title="NoteVault"
      />
    </motion.aside>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="sidebar-empty-hint">{text}</p>;
}

function VirtualNoteList({
  items,
  activeId,
  onSelect,
  onTogglePin,
  onTrash,
}: {
  items: Doc<"notes">[];
  activeId: Id<"notes"> | null;
  onSelect: (id: Id<"notes"> | null) => void;
  onTogglePin: (id: Id<"notes">, pinned: boolean) => void;
  onTrash: (id: Id<"notes">) => void;
}) {
  return (
    <VirtualList
      items={items}
      estimateSize={36}
      overscan={8}
      className="sidebar-virtual"
      getKey={(item) => item._id}
      renderItem={(item) => (
        <SidebarItem
          item={item}
          active={item._id === activeId}
          onSelect={() => onSelect(item._id)}
          onTogglePin={() => onTogglePin(item._id, item.pinned)}
          onTrash={() => onTrash(item._id)}
        />
      )}
    />
  );
}

function SidebarSection({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="sidebar-section">
      <div className="sidebar-section-head">
        <p className="sidebar-section-title">{title}</p>
        {action}
      </div>
      <div className="sidebar-section-items">{children}</div>
    </div>
  );
}

function SidebarItem({
  item,
  active,
  onSelect,
  onTogglePin,
  onTrash,
}: {
  item: Doc<"notes">;
  active: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
  onTrash: () => void;
}) {
  const label = getLabelColor(item.color);
  const folder = isFolder(item);

  return (
    <div className={`sidebar-item group ${active ? "sidebar-item-active" : ""}`}>
      <button type="button" className="sidebar-item-btn" onClick={onSelect}>
        <span className="sidebar-item-stripe" style={{ background: label.hex }} />
        {folder ? (
          <FolderOpen className="size-3.5 shrink-0 text-muted" />
        ) : (
          <span className="sidebar-item-emoji">{item.icon}</span>
        )}
        <span className="truncate">{item.title || "Untitled"}</span>
      </button>
      <div className="sidebar-item-actions">
        <ActionBtn label="Favorite" onClick={onTogglePin}>
          <Pin className={`size-3 ${item.pinned ? "fill-accent text-accent" : ""}`} />
        </ActionBtn>
        <ActionBtn label="Move to bin" onClick={onTrash}>
          <Trash2 className="size-3" />
        </ActionBtn>
      </div>
    </div>
  );
}

function TreeNode({
  item,
  depth,
  activeId,
  childrenByParent,
  expanded,
  onToggleExpanded,
  onSelect,
  onCreateEntry,
  onCreateCollection,
  onTogglePin,
  onTrash,
}: {
  item: Doc<"notes">;
  depth: number;
  activeId: Id<"notes"> | null;
  childrenByParent: Map<string, Doc<"notes">[]>;
  expanded: Record<string, boolean>;
  onToggleExpanded: (id: Id<"notes">, next: boolean) => void;
  onSelect: (id: Id<"notes">) => void;
  onCreateEntry: (parentId?: Id<"notes">, templateId?: string) => void;
  onCreateCollection: (parentId?: Id<"notes">) => void;
  onTogglePin: (id: Id<"notes">, pinned: boolean) => void;
  onTrash: (id: Id<"notes">) => void;
}) {
  const children = childrenByParent.get(item._id) ?? [];
  const hasChildren = children.length > 0;
  const folder = isFolder(item);
  const isExpanded = expanded[item._id] ?? (folder && hasChildren);

  return (
    <li>
      <div className="sidebar-tree-row group" style={{ paddingLeft: depth * 12 }}>
        <button
          type="button"
          className={`sidebar-tree-toggle ${hasChildren || folder ? "" : "invisible"}`}
          onClick={() => onToggleExpanded(item._id, !isExpanded)}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        </button>
        <div className="min-w-0 flex-1">
          <SidebarItem
            item={item}
            active={item._id === activeId}
            onSelect={() => onSelect(item._id)}
            onTogglePin={() => onTogglePin(item._id, item.pinned)}
            onTrash={() => onTrash(item._id)}
          />
        </div>
        {folder && (
          <button
            type="button"
            className="sidebar-tree-add"
            onClick={() => onCreateEntry(item._id)}
            aria-label="Add entry"
          >
            <Plus className="size-3" />
          </button>
        )}
      </div>
      {isExpanded && children.length > 0 && (
        <ul>
          {children.map((child) => (
            <TreeNode
              key={child._id}
              item={child}
              depth={depth + 1}
              activeId={activeId}
              childrenByParent={childrenByParent}
              expanded={expanded}
              onToggleExpanded={onToggleExpanded}
              onSelect={onSelect}
              onCreateEntry={onCreateEntry}
              onCreateCollection={onCreateCollection}
              onTogglePin={onTogglePin}
              onTrash={onTrash}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function ActionBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className="sidebar-action-btn" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}
