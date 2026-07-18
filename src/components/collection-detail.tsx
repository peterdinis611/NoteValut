"use client";

import { useMutation, useQuery } from "convex/react";
import {
  FileText,
  FolderOpen,
  Grid3X3,
  LayoutList,
  Lock,
  Plus,
  Settings2,
  Share2,
  Table2,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import {
  type Block,
  blocksToPlainText,
  defaultBlocks,
  migrateContentToBlocks,
} from "@/lib/blocks";
import { getLabelColor, LABEL_COLORS } from "@/lib/colors";
import { formatRelativeTime } from "@/lib/format";
import { isFolder } from "@/lib/item-kinds";
import { easeQuick, pageVariants } from "@/lib/motion";
import { useCustomTemplates } from "@/hooks/use-custom-templates";
import { PAGE_TEMPLATES } from "@/lib/templates";
import { useVaultAccess } from "@/context/vault-access";
import { VaultEditor } from "@/editor";
import { IconPicker } from "./icon-picker";
import { SharePanel } from "./share-panel";
import { useToast } from "./toast";

type Tab = "overview" | "contents" | "settings";

type Props = {
  folder: Doc<"notes">;
  ownerId: string;
  onNavigate: (id: Id<"notes">) => void;
  onCreateEntry: (parentId: Id<"notes">, templateId?: string) => void;
  onCreateCollection: (parentId: Id<"notes">) => void;
};

export function CollectionDetail({
  folder,
  ownerId,
  onNavigate,
  onCreateEntry,
  onCreateCollection,
}: Props) {
  const toast = useToast();
  const { readOnly: globalReadOnly } = useVaultAccess();
  const children = useQuery(api.notes.listChildren, { parentId: folder._id });
  const updateNote = useMutation(api.notes.update);
  const trashNote = useMutation(api.notes.trash);

  const [tab, setTab] = useState<Tab>("overview");
  const [folderBlocks, setFolderBlocks] = useState<Block[]>(defaultBlocks());
  const [shareOpen, setShareOpen] = useState(false);
  const customTemplates = useCustomTemplates();
  const templateOptions = useMemo(
    () => [...customTemplates, ...PAGE_TEMPLATES],
    [customTemplates],
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");

  const readOnly = globalReadOnly || !!folder.isLocked;
  const label = getLabelColor(folder.color);
  const viewMode = folder.viewMode ?? "grid";

  useEffect(() => {
    setFolderBlocks(
      folder.folderBlocks?.length
        ? folder.folderBlocks
        : folder.description
          ? migrateContentToBlocks(folder.description)
          : defaultBlocks(),
    );
  }, [folder._id, folder.folderBlocks, folder.description]);

  async function handleTrashChild(id: Id<"notes">) {
    if (readOnly) return;
    try {
      await trashNote({ id });
      toast.success("Moved to bin");
    } catch {
      toast.error("Couldn’t move to bin");
    }
  }

  function scheduleFolderSave(blocks: Block[]) {
    if (readOnly) return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await updateNote({
        id: folder._id,
        folderBlocks: blocks,
        content: blocksToPlainText(blocks),
      });
      setSaveState("saved");
    }, 450);
  }

  const stats = {
    entries: children?.filter((c) => !isFolder(c)).length ?? 0,
    collections: children?.filter((c) => isFolder(c)).length ?? 0,
  };

  return (
    <div className="collection-detail note-scroll">
      {readOnly && (
        <div className="readonly-banner">
          <Lock className="size-4 shrink-0" />
          {folder.isLocked
            ? "This collection is locked — unlock in Settings to edit."
            : "Read-only view — you can browse but not make changes."}
        </div>
      )}

      <div className="collection-hero" style={{ borderColor: label.hex }}>
        <div className="collection-hero-top">
          <IconPicker
            value={folder.icon}
            size="lg"
            onChange={(icon) => !readOnly && updateNote({ id: folder._id, icon })}
          />
          <div className="flex-1">
            <input
              className="collection-title"
              value={folder.title}
              placeholder="Collection name"
              readOnly={readOnly}
              onChange={(e) => updateNote({ id: folder._id, title: e.target.value })}
            />
            <p className="collection-meta">
              {stats.entries} entries · {stats.collections} sub-collections
              {!readOnly && (
                <span className="ml-2 text-muted">
                  {saveState === "saving" ? "Saving…" : tab === "overview" ? "Saved" : ""}
                </span>
              )}
            </p>
          </div>
          {!readOnly && (
            <button type="button" className="vault-btn-secondary" onClick={() => setShareOpen(true)}>
              <Share2 className="size-4" />
              Share
            </button>
          )}
        </div>

        <div className="collection-tabs">
          <TabBtn active={tab === "overview"} onClick={() => setTab("overview")}>
            Overview
          </TabBtn>
          <TabBtn active={tab === "contents"} onClick={() => setTab("contents")}>
            Contents ({children?.length ?? 0})
          </TabBtn>
          <TabBtn active={tab === "settings"} onClick={() => setTab("settings")}>
            <Settings2 className="size-3.5" />
            Settings
          </TabBtn>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div
            key="overview"
            className="collection-panel"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={easeQuick}
          >
            <section className="collection-section">
              <h3 className="collection-section-title">Collection notes</h3>
              <p className="collection-section-desc">
                Document goals, guidelines, or context for everything in this collection.
              </p>
              <VaultEditor
                blocks={folderBlocks}
                readOnly={readOnly}
                onChange={(next) => {
                  setFolderBlocks(next);
                  scheduleFolderSave(next);
                }}
              />
            </section>

            <section className="collection-section">
              <h3 className="collection-section-title">Label</h3>
              <div className="flex gap-1.5">
                {LABEL_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={readOnly}
                    className={`color-dot ${folder.color === c.id ? "color-dot-active" : ""}`}
                    style={{ background: c.hex }}
                    onClick={() => updateNote({ id: folder._id, color: c.id })}
                  />
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {tab === "contents" && (
          <motion.div
            key="contents"
            className="collection-panel"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={easeQuick}
          >
            {!readOnly && (
              <div className="collection-view-toolbar">
                <button type="button" className="vault-btn-primary" onClick={() => onCreateEntry(folder._id, folder.defaultTemplateId ?? "blank")}>
                  <Plus className="size-4" />
                  New entry
                </button>
                <button type="button" className="vault-btn-secondary" onClick={() => onCreateCollection(folder._id)}>
                  <FolderOpen className="size-4" />
                  Sub-collection
                </button>
                <div className="collection-view-toggle">
                  <button
                    type="button"
                    className={viewMode === "grid" ? "view-toggle-active" : ""}
                    onClick={() => !readOnly && updateNote({ id: folder._id, viewMode: "grid" })}
                    title="Grid"
                  >
                    <Grid3X3 className="size-4" />
                  </button>
                  <button
                    type="button"
                    className={viewMode === "list" ? "view-toggle-active" : ""}
                    onClick={() => !readOnly && updateNote({ id: folder._id, viewMode: "list" })}
                    title="List"
                  >
                    <LayoutList className="size-4" />
                  </button>
                  <button
                    type="button"
                    className={viewMode === "table" ? "view-toggle-active" : ""}
                    onClick={() => !readOnly && updateNote({ id: folder._id, viewMode: "table" })}
                    title="Table"
                  >
                    <Table2 className="size-4" />
                  </button>
                </div>
              </div>
            )}

            {children === undefined ? (
              <p className="text-muted">Loading…</p>
            ) : children.length === 0 ? (
              <div className="folder-empty">
                <FolderOpen className="size-10 text-muted" />
                <p>Empty collection</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="folder-grid">
                {children.map((child) => (
                  <ChildCard
                    key={child._id}
                    child={child}
                    readOnly={readOnly}
                    onNavigate={onNavigate}
                    onTrash={() => handleTrashChild(child._id)}
                  />
                ))}
              </div>
            ) : viewMode === "table" ? (
              <CollectionTable
                items={children}
                readOnly={readOnly}
                onNavigate={onNavigate}
                onUpdate={(id, patch) => void updateNote({ id, ...patch })}
              />
            ) : (
              <div className="collection-list">
                {children.map((child) => (
                  <div key={child._id} className="collection-list-row-wrap">
                    <button
                      type="button"
                      className="collection-list-row"
                      onClick={() => onNavigate(child._id)}
                    >
                      <span
                        className="collection-list-stripe"
                        style={{ background: getLabelColor(child.color).hex }}
                      />
                      <span className="text-lg">{isFolder(child) ? "🗂️" : child.icon}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {child.title || "Untitled"}
                      </span>
                      <span className="text-xs text-muted">
                        {isFolder(child) ? "Collection" : "Entry"} ·{" "}
                        {formatRelativeTime(child.updatedAt)}
                      </span>
                    </button>
                    {!readOnly && (
                      <button
                        type="button"
                        className="collection-list-trash"
                        aria-label="Move to bin"
                        onClick={() => handleTrashChild(child._id)}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === "settings" && (
          <motion.div
            key="settings"
            className="collection-panel"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={easeQuick}
          >
            <SettingRow label="Sort contents by">
              <select
                className="share-select"
                value={folder.sortMode ?? "updated"}
                disabled={readOnly}
                onChange={(e) =>
                  updateNote({
                    id: folder._id,
                    sortMode: e.target.value as "updated" | "name" | "kind",
                  })
                }
              >
                <option value="updated">Last edited</option>
                <option value="name">Name (A–Z)</option>
                <option value="kind">Type (collections first)</option>
              </select>
            </SettingRow>

            <SettingRow label="Default template for new entries">
              <select
                className="share-select"
                value={folder.defaultTemplateId ?? "blank"}
                disabled={readOnly}
                onChange={(e) =>
                  updateNote({ id: folder._id, defaultTemplateId: e.target.value })
                }
              >
                {templateOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {t.name}
                  </option>
                ))}
              </select>
            </SettingRow>

            <SettingRow label="Lock collection (read-only)">
              <label className="share-toggle-row">
                <input
                  type="checkbox"
                  checked={!!folder.isLocked}
                  disabled={globalReadOnly}
                  onChange={async (e) => {
                    try {
                      await updateNote({ id: folder._id, isLocked: e.target.checked });
                      toast.success(
                        e.target.checked ? "Collection locked" : "Collection unlocked",
                      );
                    } catch {
                      toast.error("Couldn’t update lock");
                    }
                  }}
                />
                <span>Prevent edits to this collection and its overview</span>
              </label>
            </SettingRow>

            <SettingRow label="Sharing">
              <button
                type="button"
                className="vault-btn-secondary"
                onClick={() => setShareOpen(true)}
              >
                <Share2 className="size-4" />
                Manage collection share links
              </button>
            </SettingRow>
          </motion.div>
        )}
      </AnimatePresence>

      <SharePanel
        ownerId={ownerId}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        scope="collection"
        noteId={folder._id}
        title={folder.title}
      />
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={`collection-tab ${active ? "collection-tab-active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="collection-setting-row">
      <span className="collection-setting-label">{label}</span>
      <div className="collection-setting-control">{children}</div>
    </div>
  );
}

function ChildCard({
  child,
  readOnly,
  onNavigate,
  onTrash,
}: {
  child: Doc<"notes">;
  readOnly?: boolean;
  onNavigate: (id: Id<"notes">) => void;
  onTrash: () => void;
}) {
  return (
    <div className="folder-card-wrap">
      <button type="button" className="folder-card" onClick={() => onNavigate(child._id)}>
        <div
          className="folder-card-stripe"
          style={{ background: getLabelColor(child.color).hex }}
        />
        <span className="text-2xl">{child.icon}</span>
        <span className="truncate font-medium">{child.title || "Untitled"}</span>
        <span className="flex items-center gap-1 text-xs text-muted">
          {isFolder(child) ? (
            <>
              <FolderOpen className="size-3" /> Collection
            </>
          ) : (
            <>
              <FileText className="size-3" /> Entry
            </>
          )}
          · {formatRelativeTime(child.updatedAt)}
        </span>
      </button>
      {!readOnly && (
        <button
          type="button"
          className="folder-card-trash"
          aria-label="Move to bin"
          onClick={onTrash}
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}

const STATUS_OPTIONS = ["", "Todo", "Doing", "Done", "Blocked"] as const;

function CollectionTable({
  items,
  readOnly,
  onNavigate,
  onUpdate,
}: {
  items: Doc<"notes">[];
  readOnly?: boolean;
  onNavigate: (id: Id<"notes">) => void;
  onUpdate: (
    id: Id<"notes">,
    patch: { status?: string | null; tags?: string[]; pinned?: boolean },
  ) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState("");

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      for (const t of item.tags ?? []) set.add(t);
    }
    return [...set].sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all") {
        const st = item.status || "";
        if (statusFilter === "none" ? st !== "" : st !== statusFilter) return false;
      }
      if (tagFilter && !(item.tags ?? []).includes(tagFilter)) return false;
      return true;
    });
  }, [items, statusFilter, tagFilter]);

  return (
    <div className="db-table-wrap">
      <div className="db-table-filters">
        <label className="db-filter">
          <span>Status</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="none">No status</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="db-filter">
          <span>Tag</span>
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="">All tags</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="db-table note-scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Tags</th>
              <th>Updated</th>
              <th>Star</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item._id}>
                <td>
                  <button
                    type="button"
                    className="db-table-name"
                    onClick={() => onNavigate(item._id)}
                  >
                    <span>{isFolder(item) ? "🗂️" : item.icon}</span>
                    <span>{item.title || "Untitled"}</span>
                  </button>
                </td>
                <td>
                  <select
                    className="db-table-select"
                    value={item.status ?? ""}
                    disabled={readOnly || isFolder(item)}
                    onChange={(e) =>
                      onUpdate(item._id, { status: e.target.value || null })
                    }
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s || "none"} value={s}>
                        {s || "—"}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="db-table-tags">
                  {(item.tags ?? []).slice(0, 3).map((t) => (
                    <span key={t} className="db-tag">
                      {t}
                    </span>
                  ))}
                </td>
                <td className="db-table-muted">{formatRelativeTime(item.updatedAt)}</td>
                <td>
                  <button
                    type="button"
                    className={`db-star ${item.pinned ? "is-on" : ""}`}
                    disabled={readOnly}
                    aria-label="Toggle star"
                    onClick={() => onUpdate(item._id, { pinned: !item.pinned })}
                  >
                    {item.pinned ? "★" : "☆"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
