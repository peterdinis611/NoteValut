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
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
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
                  >
                    <Grid3X3 className="size-4" />
                  </button>
                  <button
                    type="button"
                    className={viewMode === "list" ? "view-toggle-active" : ""}
                    onClick={() => !readOnly && updateNote({ id: folder._id, viewMode: "list" })}
                  >
                    <LayoutList className="size-4" />
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
                {PAGE_TEMPLATES.map((t) => (
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
