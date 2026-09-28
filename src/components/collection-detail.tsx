"use client";

import { useMutation, useQuery } from "convex/react";
import {
  Columns3,
  FileText,
  FolderOpen,
  Grid3X3,
  LayoutGrid,
  LayoutList,
  Lock,
  Plus,
  Settings2,
  Share2,
  Table2,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { useAnimeEnter } from "@/lib/anime-ui";
import { type Block, blocksToPlainText, defaultBlocks, migrateContentToBlocks } from "@/lib/blocks";
import { getLabelColor, LABEL_COLORS } from "@/lib/colors";
import { formatRelativeTime } from "@/lib/format";
import { isFolder } from "@/lib/item-kinds";
import { STATUS_OPTIONS } from "@/lib/status";
import {
  applyViewConfig,
  defaultPropertyDefs,
  type PropertyDef,
  type PropertyMap,
  type ViewConfig,
} from "@/lib/properties";
import { useCustomTemplates } from "@/hooks/use-custom-templates";
import { PAGE_TEMPLATES } from "@/lib/templates";
import { useVaultAccess } from "@/context/vault-access";
import { VaultEditor } from "@/editor";
import { CollectionKanban } from "./collection-kanban";
import { IconPicker } from "./icon-picker";
import { CoverBanner } from "./cover-banner";
import { CollectionPropertySchema } from "./page-properties";
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
  const { readOnly: globalReadOnly, ability } = useVaultAccess();
  const canShare = ability.can("share", "Note");
  const canUpdate = ability.can("update", "Note");
  const children = useQuery(api.notes.listChildren, { parentId: folder._id });
  const updateNote = useMutation(api.notes.update);
  const trashNote = useMutation(api.notes.trash);

  const [tab, setTab] = useState<Tab>("overview");
  const [folderBlocks, setFolderBlocks] = useState<Block[]>(defaultBlocks());
  const [shareOpen, setShareOpen] = useState(false);
  const customTemplates = useCustomTemplates();
  const templateOptions = useMemo(() => [...customTemplates, ...PAGE_TEMPLATES], [customTemplates]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const panelRef = useAnimeEnter<HTMLDivElement>("page", tab);

  const readOnly = globalReadOnly || !canUpdate || !!folder.isLocked;
  const label = getLabelColor(folder.color);
  const viewMode = folder.viewMode ?? "grid";
  const propertyDefs = (folder.propertyDefs as PropertyDef[] | undefined) ?? defaultPropertyDefs();
  const viewConfig = folder.viewConfig as ViewConfig | undefined;

  const viewItems = useMemo(() => {
    if (!children) return undefined;
    return applyViewConfig(children, viewConfig);
  }, [children, viewConfig]);

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

      <div className="collection-cover-wrap group/page relative">
        <CoverBanner
          coverColor={folder.coverColor}
          coverImage={folder.coverImage}
          readOnly={readOnly}
          compactEmpty={false}
          onSetCoverColor={(cover) =>
            void updateNote({
              id: folder._id,
              coverColor: cover,
              coverImage: cover ? null : (folder.coverImage ?? null),
            })
          }
          onSetCoverImage={(url) =>
            void updateNote({
              id: folder._id,
              coverImage: url,
              coverColor: url ? null : (folder.coverColor ?? null),
            })
          }
          onError={(msg) => toast.error(msg)}
          onSuccess={(msg) => toast.success(msg)}
        />
      </div>

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
          {canShare && (
            <button
              type="button"
              className="vault-btn-secondary"
              onClick={() => setShareOpen(true)}
            >
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

      <div ref={panelRef} key={tab}>
        {tab === "overview" && (
          <div className="collection-panel">
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
          </div>
        )}

        {tab === "contents" && (
          <div className="collection-panel">
            {!readOnly && (
              <div className="collection-view-toolbar">
                <button
                  type="button"
                  className="vault-btn-primary"
                  onClick={() => onCreateEntry(folder._id, folder.defaultTemplateId ?? "blank")}
                >
                  <Plus className="size-4" />
                  New entry
                </button>
                <button
                  type="button"
                  className="vault-btn-secondary"
                  onClick={() => onCreateCollection(folder._id)}
                >
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
                  <button
                    type="button"
                    className={viewMode === "gallery" ? "view-toggle-active" : ""}
                    onClick={() =>
                      !readOnly && updateNote({ id: folder._id, viewMode: "gallery" })
                    }
                    title="Gallery"
                  >
                    <LayoutGrid className="size-4" />
                  </button>
                  <button
                    type="button"
                    className={viewMode === "kanban" ? "view-toggle-active" : ""}
                    onClick={() =>
                      !readOnly && updateNote({ id: folder._id, viewMode: "kanban" })
                    }
                    title="Kanban"
                  >
                    <Columns3 className="size-4" />
                  </button>
                </div>
              </div>
            )}

            {viewItems === undefined ? (
              <p className="text-muted">Loading…</p>
            ) : viewItems.length === 0 ? (
              <div className="folder-empty">
                <FolderOpen className="size-10 text-muted" />
                <p>Empty collection</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="folder-grid">
                {viewItems.map((child) => (
                  <ChildCard
                    key={child._id}
                    child={child}
                    readOnly={readOnly}
                    onNavigate={onNavigate}
                    onTrash={() => handleTrashChild(child._id)}
                  />
                ))}
              </div>
            ) : viewMode === "gallery" ? (
              <div className="collection-gallery">
                {viewItems.map((child) => (
                  <GalleryCard
                    key={child._id}
                    child={child}
                    readOnly={readOnly}
                    onNavigate={onNavigate}
                    onTrash={() => handleTrashChild(child._id)}
                  />
                ))}
              </div>
            ) : viewMode === "kanban" ? (
              <CollectionKanban
                items={viewItems}
                readOnly={readOnly}
                groupBy={viewConfig?.groupBy ?? "status"}
                onNavigate={onNavigate}
                onUpdateStatus={(id, status) => void updateNote({ id, status })}
                onUpdateProperty={(id, propertyId, value) =>
                  void updateNote({
                    id,
                    properties: {
                      ...((viewItems.find((c) => c._id === id)?.properties as PropertyMap) ?? {}),
                      [propertyId]: value,
                    },
                  })
                }
              />
            ) : viewMode === "table" ? (
              <CollectionTable
                items={viewItems}
                propertyDefs={propertyDefs}
                readOnly={readOnly}
                onNavigate={onNavigate}
                onUpdate={(id, patch) => void updateNote({ id, ...patch })}
              />
            ) : (
              <div className="collection-list">
                {viewItems.map((child) => (
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
          </div>
        )}

        {tab === "settings" && (
          <div className="collection-panel">
            <CollectionPropertySchema
              folderId={folder._id}
              defs={folder.propertyDefs as PropertyDef[] | undefined}
              readOnly={readOnly}
            />

            <SettingRow label="Group / sort (views)">
              <div className="db-view-config">
                <label>
                  Group by
                  <select
                    className="share-select"
                    value={viewConfig?.groupBy ?? "status"}
                    disabled={readOnly}
                    onChange={(e) =>
                      void updateNote({
                        id: folder._id,
                        viewConfig: {
                          ...(viewConfig ?? {}),
                          groupBy: e.target.value,
                        },
                      })
                    }
                  >
                    <option value="status">Status</option>
                    {propertyDefs
                      .filter((d) => d.id !== "status")
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Sort
                  <select
                    className="share-select"
                    value={viewConfig?.sorts?.[0]?.builtin ?? "updated"}
                    disabled={readOnly}
                    onChange={(e) =>
                      void updateNote({
                        id: folder._id,
                        viewConfig: {
                          ...(viewConfig ?? {}),
                          sorts: [
                            {
                              builtin: e.target.value as "updated" | "title" | "status" | "pinned",
                              dir: "desc",
                            },
                          ],
                        },
                      })
                    }
                  >
                    <option value="updated">Last edited</option>
                    <option value="title">Name</option>
                    <option value="status">Status</option>
                    <option value="pinned">Pinned</option>
                  </select>
                </label>
              </div>
            </SettingRow>

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
                onChange={(e) => updateNote({ id: folder._id, defaultTemplateId: e.target.value })}
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
                      toast.success(e.target.checked ? "Collection locked" : "Collection unlocked");
                    } catch {
                      toast.error("Couldn’t update lock");
                    }
                  }}
                />
                <span>Prevent edits to this collection and its overview</span>
              </label>
            </SettingRow>

            {canShare && (
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
            )}
          </div>
        )}
      </div>

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
    <button
      type="button"
      className={`collection-tab ${active ? "collection-tab-active" : ""}`}
      onClick={onClick}
    >
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

function GalleryCard({
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
  const hasImage = !!child.coverImage;
  const hasColor = !!child.coverColor;

  return (
    <div className="collection-gallery-card-wrap">
      <button
        type="button"
        className="collection-gallery-card"
        onClick={() => onNavigate(child._id)}
      >
        <div
          className={`collection-gallery-media ${!hasImage && !hasColor ? "is-empty" : ""}`}
          style={
            hasImage
              ? { backgroundImage: `url(${child.coverImage})` }
              : hasColor
                ? undefined
                : { background: getLabelColor(child.color).hex }
          }
        >
          {hasColor && !hasImage && (
            <div className={`collection-gallery-gradient bg-gradient-to-br ${child.coverColor}`} />
          )}
          {!hasImage && !hasColor && (
            <span className="collection-gallery-fallback-icon">{child.icon || "📝"}</span>
          )}
        </div>
        <div className="collection-gallery-meta">
          <span className="collection-gallery-title">{child.title || "Untitled"}</span>
          <span className="collection-gallery-sub">
            {isFolder(child) ? "Collection" : "Entry"} · {formatRelativeTime(child.updatedAt)}
          </span>
        </div>
      </button>
      {!readOnly && (
        <button
          type="button"
          className="collection-gallery-trash"
          aria-label="Move to bin"
          onClick={onTrash}
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function CollectionTable({
  items,
  propertyDefs,
  readOnly,
  onNavigate,
  onUpdate,
}: {
  items: Doc<"notes">[];
  propertyDefs: PropertyDef[];
  readOnly?: boolean;
  onNavigate: (id: Id<"notes">) => void;
  onUpdate: (
    id: Id<"notes">,
    patch: {
      status?: string | null;
      tags?: string[];
      pinned?: boolean;
      properties?: PropertyMap;
    },
  ) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState("");
  const extraDefs = propertyDefs.filter((d) => d.id !== "status" && d.id !== "tags");

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
      if (
        tagFilter &&
        !(item.tags ?? []).some((t) => t.toLowerCase() === tagFilter.toLowerCase())
      ) {
        return false;
      }
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
              {extraDefs.map((d) => (
                <th key={d.id}>{d.name}</th>
              ))}
              <th>Tags</th>
              <th>Updated</th>
              <th>Star</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const props = (item.properties ?? {}) as PropertyMap;
              return (
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
                      onChange={(e) => onUpdate(item._id, { status: e.target.value || null })}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s || "none"} value={s}>
                          {s || "—"}
                        </option>
                      ))}
                    </select>
                  </td>
                  {extraDefs.map((d) => (
                    <td key={d.id}>
                      {d.type === "select" ? (
                        <select
                          className="db-table-select"
                          value={String(props[d.id] ?? "")}
                          disabled={readOnly || isFolder(item)}
                          onChange={(e) =>
                            onUpdate(item._id, {
                              properties: { ...props, [d.id]: e.target.value || null },
                            })
                          }
                        >
                          <option value="">—</option>
                          {(d.options ?? []).map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="db-table-muted">
                          {props[d.id] == null ? "—" : String(props[d.id])}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="db-table-tags">
                    {(item.tags ?? []).slice(0, 3).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="db-tag"
                        title={`Filter by #${t}`}
                        onClick={() => setTagFilter(t)}
                      >
                        {t}
                      </button>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
