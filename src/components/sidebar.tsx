"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMutation, useQuery } from "convex/react";
import { useDebouncedValue } from "@tanstack/react-pacer";
import {
  Archive,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  FolderOpen,
  GripVertical,
  Home,
  PanelLeftClose,
  Pin,
  Plus,
  Search,
  Settings2,
  Share2,
  StickyNote,
  Tag,
  Trash2,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { toDailyKey } from "@/lib/daily";
import { isFolder } from "@/lib/item-kinds";
import { easeOutSoft, sidebarVariants } from "@/lib/motion";
import { searchNotes } from "@/lib/search";
import { CreateMenu } from "./create-menu";
import { MoveDialog } from "./move-dialog";
import { SharePanel } from "./share-panel";
import { AuthControls } from "./auth-controls";
import { useToast } from "./toast";
import { VirtualList } from "./virtual-list";

type BrowseMode = "all" | "favorites" | "recent" | "collections" | "archive";
type DropPosition = "before" | "after" | "inside";
type DropIntent = { overId: Id<"notes">; position: DropPosition } | null;

function compareSidebarOrder(a: Doc<"notes">, b: Doc<"notes">) {
  const ao = a.sortOrder;
  const bo = b.sortOrder;
  if (ao != null || bo != null) {
    return (ao ?? Number.MAX_SAFE_INTEGER) - (bo ?? Number.MAX_SAFE_INTEGER);
  }
  if (isFolder(a) !== isFolder(b)) return isFolder(a) ? -1 : 1;
  return b.updatedAt - a.updatedAt;
}

function dropTargetId(id: string) {
  return `drop:${id}`;
}

function parseDropTargetId(id: string | number): Id<"notes"> | null {
  const raw = String(id);
  if (!raw.startsWith("drop:")) return null;
  return raw.slice(5) as Id<"notes">;
}

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
  const [browse, setBrowse] = useState<BrowseMode>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTag, setBulkTag] = useState("");
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [dragId, setDragId] = useState<Id<"notes"> | null>(null);
  const [dropIntent, setDropIntent] = useState<DropIntent>(null);

  const notes = useQuery(api.notes.list, { ownerId });
  const trashed = useQuery(api.notes.listTrashed, { ownerId });
  const archived = useQuery(api.notes.listArchived, { ownerId });

  const updateNote = useMutation(api.notes.update);
  const moveNote = useMutation(api.notes.move);
  const bulkUpdate = useMutation(api.notes.bulkUpdate);
  const bulkTrash = useMutation(api.notes.bulkTrash);
  const bulkAddTag = useMutation(api.notes.bulkAddTag);
  const bulkRemoveTag = useMutation(api.notes.bulkRemoveTag);
  const trashNote = useMutation(api.notes.trash);
  const restoreNote = useMutation(api.notes.restoreFromTrash);
  const emptyTrash = useMutation(api.notes.emptyTrash);
  const getOrCreateDaily = useMutation(api.notes.getOrCreateDaily);

  function toggleSelect(id: Id<"notes">) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function runBulk(
    action: "archive" | "unarchive" | "pin" | "unpin" | "trash" | "tag" | "untag",
  ) {
    const ids = [...selectedIds] as Id<"notes">[];
    if (!ids.length) return;
    try {
      if (action === "trash") {
        await bulkTrash({ ids });
        toast.success(`Moved ${ids.length} to bin`);
      } else if (action === "tag" || action === "untag") {
        const tag = bulkTag.trim();
        if (!tag) {
          toast.error("Enter a tag first");
          return;
        }
        const n =
          action === "tag"
            ? await bulkAddTag({ ownerId, ids, tag })
            : await bulkRemoveTag({ ownerId, ids, tag });
        toast.success(
          action === "tag"
            ? `Tagged ${n} item${n === 1 ? "" : "s"}`
            : `Removed tag from ${n} item${n === 1 ? "" : "s"}`,
        );
        setBulkTag("");
      } else {
        await bulkUpdate({
          ids,
          ...(action === "archive" ? { archived: true } : {}),
          ...(action === "unarchive" ? { archived: false } : {}),
          ...(action === "pin" ? { pinned: true } : {}),
          ...(action === "unpin" ? { pinned: false } : {}),
        });
        toast.success(`Updated ${ids.length} items`);
      }
      clearSelection();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk action failed");
    }
  }

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
      list.sort(compareSidebarOrder);
    }
    return map;
  }, [activeItems]);

  const notesById = useMemo(() => {
    const map = new Map<string, Doc<"notes">>();
    for (const note of activeItems) map.set(note._id, note);
    return map;
  }, [activeItems]);

  const rootItems = childrenByParent.get("root") ?? [];
  const trashCount = trashed?.length ?? 0;
  const homeActive =
    activeId === null &&
    !settingsActive &&
    !tagsActive &&
    !isSearching &&
    !showBin;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const dragItem = dragId ? notesById.get(dragId) : null;

  function setBrowseMode(mode: BrowseMode) {
    setShowBin(false);
    setBrowse(mode);
  }

  function wouldCreateCycle(active: Id<"notes">, newParent: Id<"notes"> | null) {
    if (!newParent) return false;
    let cursor: Id<"notes"> | undefined = newParent;
    while (cursor) {
      if (cursor === active) return true;
      cursor = notesById.get(cursor)?.parentId as Id<"notes"> | undefined;
    }
    return false;
  }

  function resolveDrop(
    active: Id<"notes">,
    overId: Id<"notes">,
    position: DropPosition,
  ): { parentId: Id<"notes"> | null; afterId: Id<"notes"> | null | undefined } | null {
    const over = notesById.get(overId);
    if (!over || active === overId) return null;

    if (position === "inside") {
      if (!isFolder(over) || wouldCreateCycle(active, overId)) return null;
      return { parentId: overId, afterId: undefined };
    }

    const parentId = (over.parentId ?? null) as Id<"notes"> | null;
    if (wouldCreateCycle(active, parentId)) return null;

    const siblings = childrenByParent.get(parentId ?? "root") ?? [];
    const overIndex = siblings.findIndex((s) => s._id === overId);
    if (overIndex < 0) return null;

    if (position === "before") {
      let prevIndex = overIndex - 1;
      while (prevIndex >= 0 && siblings[prevIndex]?._id === active) prevIndex -= 1;
      const prev = siblings[prevIndex];
      return { parentId, afterId: prev ? prev._id : null };
    }

    if (overId === active) return null;
    return { parentId, afterId: overId };
  }

  function getDropIntent(event: DragMoveEvent | DragEndEvent): DropIntent {
    const { active, over } = event;
    if (!over) return null;
    const overId = parseDropTargetId(over.id);
    if (!overId || overId === active.id) return null;

    const overNote = notesById.get(overId);
    if (!overNote) return null;

    const rect = over.rect;
    const translated = active.rect.current.translated;
    const pointerY = translated
      ? translated.top + translated.height / 2
      : rect.top + rect.height / 2;
    const ratio = (pointerY - rect.top) / Math.max(rect.height, 1);

    let position: DropPosition = "after";
    if (isFolder(overNote) && ratio > 0.28 && ratio < 0.72) {
      position = "inside";
    } else if (ratio < 0.5) {
      position = "before";
    }

    if (position === "inside" && wouldCreateCycle(active.id as Id<"notes">, overId)) {
      position = ratio < 0.5 ? "before" : "after";
    }

    return { overId, position };
  }

  async function handleTreeDragEnd(event: DragEndEvent) {
    const active = event.active.id as Id<"notes">;
    const intent = getDropIntent(event) ?? dropIntent;
    setDragId(null);
    setDropIntent(null);
    if (!intent) return;

    const target = resolveDrop(active, intent.overId, intent.position);
    if (!target) return;

    const current = notesById.get(active);
    if (!current) return;
    const sameParent = (current.parentId ?? null) === target.parentId;
    if (sameParent && intent.position !== "inside") {
      const siblings = childrenByParent.get(target.parentId ?? "root") ?? [];
      const from = siblings.findIndex((s) => s._id === active);
      let to =
        intent.position === "before"
          ? siblings.findIndex((s) => s._id === intent.overId)
          : siblings.findIndex((s) => s._id === intent.overId) + 1;
      if (from >= 0 && from < to) to -= 1;
      if (from === to) return;
    }

    try {
      await moveNote({
        id: active,
        parentId: target.parentId,
        afterId: target.afterId,
      });
      if (intent.position === "inside") {
        setExpanded((e) => ({ ...e, [intent.overId]: true }));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn’t move item");
    }
  }

  const browseItems = [
    { id: "all" as const, label: "All pages", icon: StickyNote },
    { id: "favorites" as const, label: "Favorites", icon: Pin },
    { id: "recent" as const, label: "Recent", icon: Clock3 },
    { id: "collections" as const, label: "Folders", icon: FolderOpen },
    { id: "archive" as const, label: "Archive", icon: Archive },
  ];

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
          <ChevronDown className="sidebar-workspace-chevron" aria-hidden />
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
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-busy={searchPending}
        />
      </div>

      <div className="sidebar-menu">
        <button
          type="button"
          className={`sidebar-link ${homeActive ? "sidebar-link-active" : ""}`}
          onClick={() => {
            setBrowse("all");
            setShowBin(false);
            onGoHome();
          }}
        >
          <Home className="size-4" />
          <span>Home</span>
        </button>
        <button
          type="button"
          className="sidebar-link"
          onClick={async () => {
            try {
              const id = await getOrCreateDaily({ ownerId, dailyKey: toDailyKey() });
              setShowBin(false);
              onSelect(id);
            } catch {
              toast.error("Couldn’t open today");
            }
          }}
        >
          <CalendarDays className="size-4" />
          <span>Today</span>
        </button>

        <div className="sidebar-menu-divider" />

        <div className="sidebar-create-wrap">
          <button
            type="button"
            data-create-trigger
            className="sidebar-link"
            onClick={() => setShowCreate((v) => !v)}
          >
            <Plus className="size-4" />
            <span>New page</span>
          </button>
          <CreateMenu
            open={showCreate}
            onClose={() => setShowCreate(false)}
            onCreateEntry={(templateId) => onCreateEntry(undefined, templateId)}
            onCreateCollection={() => onCreateCollection()}
          />
        </div>

        {browseItems.map((item) => {
          const Icon = item.icon;
          const active = !isSearching && !showBin && !tagsActive && browse === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
              onClick={() => setBrowseMode(item.id)}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <nav className="sidebar-nav note-scroll">
        {selectedIds.size > 0 && (
          <div className="sidebar-bulk">
            <div className="sidebar-bulk-top">
              <span className="sidebar-bulk-count">{selectedIds.size} selected</span>
              <div className="sidebar-bulk-actions">
                <button type="button" onClick={() => void runBulk("pin")}>
                  Star
                </button>
                <button type="button" onClick={() => setBulkMoveOpen(true)}>
                  Move
                </button>
                <button type="button" onClick={() => void runBulk("archive")}>
                  Archive
                </button>
                <button type="button" onClick={() => void runBulk("trash")}>
                  Trash
                </button>
                <button type="button" className="sidebar-bulk-clear" onClick={clearSelection}>
                  Clear
                </button>
              </div>
            </div>
            <div className="sidebar-bulk-tag">
              <input
                value={bulkTag}
                onChange={(e) => setBulkTag(e.target.value)}
                placeholder="Add tag…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void runBulk("tag");
                }}
              />
              <button type="button" onClick={() => void runBulk("tag")}>
                Add
              </button>
              <button type="button" onClick={() => void runBulk("untag")}>
                Remove
              </button>
            </div>
          </div>
        )}
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
                    selected={selectedIds.has(item._id)}
                    snippet={"snippet" in item ? (item as { snippet?: string }).snippet : undefined}
                    onToggleSelect={() => toggleSelect(item._id)}
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
                selectedIds={selectedIds}
                onSelect={onSelect}
                onToggleSelect={toggleSelect}
                onTogglePin={handleTogglePin}
                onTrash={handleTrash}
              />
            )}
          </SidebarSection>
        ) : browse === "recent" ? (
          <SidebarSection title="Recent">
            {recent.length === 0 ? (
              <EmptyHint text="Edited pages show up here." />
            ) : (
              <VirtualNoteList
                items={recent}
                activeId={activeId}
                selectedIds={selectedIds}
                onSelect={onSelect}
                onToggleSelect={toggleSelect}
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
                selectedIds={selectedIds}
                onSelect={onSelect}
                onToggleSelect={toggleSelect}
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
            title="Private"
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={(event: DragStartEvent) => {
                  setDragId(event.active.id as Id<"notes">);
                }}
                onDragMove={(event) => setDropIntent(getDropIntent(event))}
                onDragCancel={() => {
                  setDragId(null);
                  setDropIntent(null);
                }}
                onDragEnd={(event) => void handleTreeDragEnd(event)}
              >
                <ul className="sidebar-tree">
                  {rootItems.map((item) => (
                    <TreeNode
                      key={item._id}
                      item={item}
                      depth={0}
                      activeId={activeId}
                      selectedIds={selectedIds}
                      childrenByParent={childrenByParent}
                      expanded={expanded}
                      dropIntent={dropIntent}
                      draggingId={dragId}
                      onToggleExpanded={(id, next) =>
                        setExpanded((e) => ({ ...e, [id]: next }))
                      }
                      onSelect={onSelect}
                      onToggleSelect={toggleSelect}
                      onCreateEntry={onCreateEntry}
                      onCreateCollection={onCreateCollection}
                      onTogglePin={handleTogglePin}
                      onTrash={handleTrash}
                    />
                  ))}
                </ul>
                <DragOverlay dropAnimation={null}>
                  {dragItem ? (
                    <div className="sidebar-drag-overlay">
                      <span>{dragItem.icon}</span>
                      <span className="truncate">{dragItem.title || "Untitled"}</span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </SidebarSection>
        )}
      </nav>

      <div className="sidebar-footer">
        {showBin && (
          <div className="sidebar-bin">
            <p className="sidebar-bin-title">Trash</p>
            {trashCount === 0 ? (
              <p className="sidebar-empty">Trash is empty</p>
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
                  Empty trash
                </button>
              </>
            )}
          </div>
        )}

        <div className="sidebar-footer-links">
          <button
            type="button"
            className="sidebar-link"
            onClick={onQuickCapture}
          >
            <Zap className="size-4" />
            <span>Quick capture</span>
          </button>
          {onOpenTags && (
            <button
              type="button"
              className={`sidebar-link ${tagsActive ? "sidebar-link-active" : ""}`}
              onClick={() => {
                setShowBin(false);
                onOpenTags();
              }}
            >
              <Tag className="size-4" />
              <span>Tags</span>
            </button>
          )}
          <button
            type="button"
            className="sidebar-link"
            onClick={() => setShowShare(true)}
          >
            <Share2 className="size-4" />
            <span>Share</span>
          </button>
          {onOpenSettings && (
            <button
              type="button"
              className={`sidebar-link ${settingsActive ? "sidebar-link-active" : ""}`}
              onClick={() => {
                setShowBin(false);
                onOpenSettings();
              }}
            >
              <Settings2 className="size-4" />
              <span>Settings</span>
            </button>
          )}
          <button
            type="button"
            className={`sidebar-link ${showBin ? "sidebar-link-active" : ""}`}
            onClick={() => setShowBin((v) => !v)}
          >
            <Trash2 className="size-4" />
            <span>Trash</span>
            {trashCount > 0 && <span className="sidebar-count">{trashCount}</span>}
          </button>
        </div>

        <div className="sidebar-footer-user">
          <AuthControls />
        </div>
      </div>

      <SharePanel
        ownerId={ownerId}
        open={showShare}
        onClose={() => setShowShare(false)}
        scope="vault"
        title="NoteVault"
      />
      <MoveDialog
        open={bulkMoveOpen}
        onClose={() => setBulkMoveOpen(false)}
        onMoved={clearSelection}
        ownerId={ownerId}
        noteIds={[...selectedIds] as Id<"notes">[]}
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
  selectedIds,
  onSelect,
  onToggleSelect,
  onTogglePin,
  onTrash,
}: {
  items: Doc<"notes">[];
  activeId: Id<"notes"> | null;
  selectedIds: Set<string>;
  onSelect: (id: Id<"notes"> | null) => void;
  onToggleSelect: (id: Id<"notes">) => void;
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
          selected={selectedIds.has(item._id)}
          onToggleSelect={() => onToggleSelect(item._id)}
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
  selected,
  snippet,
  onSelect,
  onToggleSelect,
  onTogglePin,
  onTrash,
}: {
  item: Doc<"notes">;
  active: boolean;
  selected?: boolean;
  snippet?: string | null;
  onSelect: () => void;
  onToggleSelect?: () => void;
  onTogglePin: () => void;
  onTrash: () => void;
}) {
  const folder = isFolder(item);

  return (
    <div
      className={`sidebar-item group ${active ? "sidebar-item-active" : ""} ${selected ? "sidebar-item-selected" : ""}`}
    >
      {onToggleSelect && (
        <input
          type="checkbox"
          className={`sidebar-item-check ${selected ? "sidebar-item-check-visible" : ""}`}
          checked={!!selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select item"
        />
      )}
      <button type="button" className="sidebar-item-btn" onClick={onSelect}>
        {folder ? (
          <FolderOpen className="sidebar-item-icon" />
        ) : (
          <span className="sidebar-item-emoji">{item.icon}</span>
        )}
        <span className="sidebar-item-copy">
          <span className="truncate">{item.title || "Untitled"}</span>
          {snippet && <span className="sidebar-item-snippet">{snippet}</span>}
        </span>
      </button>
      <div className="sidebar-item-actions">
        <ActionBtn label="Favorite" onClick={onTogglePin}>
          <Pin className={`size-3 ${item.pinned ? "fill-accent text-accent" : ""}`} />
        </ActionBtn>
        <ActionBtn label="Move to trash" onClick={onTrash}>
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
  selectedIds,
  childrenByParent,
  expanded,
  dropIntent,
  draggingId,
  onToggleExpanded,
  onSelect,
  onToggleSelect,
  onCreateEntry,
  onCreateCollection,
  onTogglePin,
  onTrash,
}: {
  item: Doc<"notes">;
  depth: number;
  activeId: Id<"notes"> | null;
  selectedIds: Set<string>;
  childrenByParent: Map<string, Doc<"notes">[]>;
  expanded: Record<string, boolean>;
  dropIntent: DropIntent;
  draggingId: Id<"notes"> | null;
  onToggleExpanded: (id: Id<"notes">, next: boolean) => void;
  onSelect: (id: Id<"notes">) => void;
  onToggleSelect: (id: Id<"notes">) => void;
  onCreateEntry: (parentId?: Id<"notes">, templateId?: string) => void;
  onCreateCollection: (parentId?: Id<"notes">) => void;
  onTogglePin: (id: Id<"notes">, pinned: boolean) => void;
  onTrash: (id: Id<"notes">) => void;
}) {
  const children = childrenByParent.get(item._id) ?? [];
  const hasChildren = children.length > 0;
  const folder = isFolder(item);
  const isExpanded = expanded[item._id] ?? (folder && hasChildren);
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ id: item._id, data: { depth, folder } });
  const { setNodeRef: setDropRef } = useDroppable({
    id: dropTargetId(item._id),
    data: { depth, folder },
  });

  function setRowRef(node: HTMLElement | null) {
    setDragRef(node);
    setDropRef(node);
  }

  const dropPos =
    dropIntent?.overId === item._id && draggingId !== item._id
      ? dropIntent.position
      : null;

  return (
    <li>
      <div
        ref={setRowRef}
        className={[
          "sidebar-tree-row group",
          isDragging ? "sidebar-tree-row-dragging" : "",
          dropPos === "before" ? "sidebar-drop-before" : "",
          dropPos === "after" ? "sidebar-drop-after" : "",
          dropPos === "inside" ? "sidebar-drop-inside" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ paddingLeft: `${0.15 + depth * 0.85}rem` }}
      >
        <button
          type="button"
          className="sidebar-tree-grip"
          aria-label="Drag to reorder"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
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
            selected={selectedIds.has(item._id)}
            onToggleSelect={() => onToggleSelect(item._id)}
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
              selectedIds={selectedIds}
              childrenByParent={childrenByParent}
              expanded={expanded}
              dropIntent={dropIntent}
              draggingId={draggingId}
              onToggleExpanded={onToggleExpanded}
              onSelect={onSelect}
              onToggleSelect={onToggleSelect}
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
