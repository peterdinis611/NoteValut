"use client";

import { useMutation, useQuery } from "convex/react";
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Home,
  PanelLeftClose,
  Pin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { getLabelColor } from "@/lib/colors";
import { isFolder } from "@/lib/item-kinds";
import { easeOutSoft, sidebarVariants } from "@/lib/motion";
import { CreateMenu } from "./create-menu";
import { useToast } from "./toast";

type Props = {
  ownerId: string;
  activeId: Id<"notes"> | null;
  onSelect: (id: Id<"notes"> | null) => void;
  onGoHome: () => void;
  onCollapse: () => void;
  onCreateEntry: (parentId?: Id<"notes">, templateId?: string) => void;
  onCreateCollection: (parentId?: Id<"notes">) => void;
};

export function Sidebar({
  ownerId,
  activeId,
  onSelect,
  onGoHome,
  onCollapse,
  onCreateEntry,
  onCreateCollection,
}: Props) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [showBin, setShowBin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const notes = useQuery(api.notes.list, { ownerId, search: search || undefined });
  const trashed = useQuery(api.notes.listTrashed, { ownerId });

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

  const isSearching = !!search.trim();
  const activeItems = useMemo(() => notes ?? [], [notes]);
  const pinned = useMemo(() => activeItems.filter((n) => n.pinned), [activeItems]);

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

      <div className="sidebar-search-wrap">
        <Search className="sidebar-search-icon" />
        <input
          className="sidebar-search"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="sidebar-quick">
        <button
          type="button"
          className={`sidebar-nav-btn ${activeId === null && !isSearching ? "sidebar-nav-btn-active" : ""}`}
          onClick={onGoHome}
        >
          <Home className="size-3.5" />
          Home
        </button>
        <div className="relative flex-1">
          <button
            type="button"
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
      </div>

      <nav className="sidebar-nav note-scroll">
        {notes === undefined ? (
          <p className="sidebar-empty">Loading…</p>
        ) : isSearching ? (
          <SidebarSection title="Results">
            {notes.length === 0 ? (
              <p className="sidebar-empty">No matches</p>
            ) : (
              notes.map((item) => (
                <SidebarItem
                  key={item._id}
                  item={item}
                  active={item._id === activeId}
                  onSelect={() => onSelect(item._id)}
                  onTogglePin={() => handleTogglePin(item._id, item.pinned)}
                  onTrash={() => handleTrash(item._id)}
                />
              ))
            )}
          </SidebarSection>
        ) : (
          <>
            {pinned.length > 0 && (
              <SidebarSection title="Favorites">
                {pinned.map((item) => (
                  <SidebarItem
                    key={item._id}
                    item={item}
                    active={item._id === activeId}
                    onSelect={() => onSelect(item._id)}
                    onTogglePin={() => handleTogglePin(item._id, item.pinned)}
                    onTrash={() => handleTrash(item._id)}
                  />
                ))}
              </SidebarSection>
            )}

            <SidebarSection title="Vault">
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
                    {trashCount > 0 && (
                      <button
                        type="button"
                        className="sidebar-empty-cta"
                        onClick={() => setShowBin(true)}
                      >
                        <Trash2 className="size-3.5" />
                        Open bin
                      </button>
                    )}
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
                      onToggleExpanded={(id, next) => setExpanded((e) => ({ ...e, [id]: next }))}
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
          </>
        )}
      </nav>

      <div className="sidebar-footer">
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
    </motion.aside>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sidebar-section">
      <p className="sidebar-section-title">{title}</p>
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
