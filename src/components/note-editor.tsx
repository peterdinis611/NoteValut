"use client";

import { useMutation, useQuery } from "convex/react";
import {
  ChevronRight,
  Copy,
  Eye,
  MoreHorizontal,
  PanelLeft,
  Pin,
  Share2,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import {
  type Block,
  blocksToPlainText,
  defaultBlocks,
  migrateContentToBlocks,
} from "@/lib/blocks";
import { isFolder } from "@/lib/item-kinds";
import { firstIssue, parseBlocks, parseTags } from "@/lib/validation";
import { useVaultAccess } from "@/context/vault-access";
import { VaultEditor } from "@/editor";
import { CollectionDetail } from "./collection-detail";
import { IconPicker } from "./icon-picker";
import { PageBreadcrumbs } from "./page-breadcrumbs";
import { PageHeaderActions } from "./page-header-actions";
import { PageProperties } from "./page-properties";
import { SharePanel } from "./share-panel";
import { useToast } from "./toast";
import { UiTooltip } from "./ui-tooltip";

type Props = {
  noteId: Id<"notes">;
  ownerId: string;
  onNavigate: (id: Id<"notes"> | null) => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  onCreateEntry: (parentId?: Id<"notes">, templateId?: string) => void;
  onCreateCollection: (parentId?: Id<"notes">) => void;
};

export function NoteEditor({
  noteId,
  ownerId,
  onNavigate,
  onToggleSidebar,
  sidebarCollapsed,
  onCreateEntry,
  onCreateCollection,
}: Props) {
  const toast = useToast();
  const { readOnly: globalReadOnly } = useVaultAccess();
  const note = useQuery(api.notes.get, { id: noteId });
  const children = useQuery(api.notes.listChildren, { parentId: noteId });
  const allNotes = useQuery(api.notes.list, { ownerId });
  const updateNote = useMutation(api.notes.update);
  const trashNote = useMutation(api.notes.trash);
  const duplicateNote = useMutation(api.notes.duplicate);

  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>(defaultBlocks());
  const [tags, setTags] = useState<string[]>([]);
  const [showIcon, setShowIcon] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");

  const readOnly = globalReadOnly;

  useEffect(() => {
    if (!note || isFolder(note)) return;
    setTitle(note.title);
    setTags(note.tags);
    setShowIcon(true);
    setBlocks(note.blocks?.length ? note.blocks : migrateContentToBlocks(note.content));
  }, [note?._id, note?.title, note?.content, note?.blocks, note?.tags]);

  function scheduleSave(patch: {
    title?: string;
    blocks?: Block[];
    tags?: string[];
    coverColor?: string | null;
    coverImage?: string | null;
  }) {
    if (!note || isFolder(note) || readOnly) return;

    if (patch.blocks) {
      const parsed = parseBlocks(patch.blocks);
      if (!parsed.success) {
        toast.error(firstIssue(parsed));
        return;
      }
    }
    if (patch.tags) {
      const parsed = parseTags(patch.tags);
      if (!parsed.success) {
        toast.error(firstIssue(parsed));
        return;
      }
    }

    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const nextBlocks = patch.blocks ?? blocks;
      await updateNote({
        id: noteId,
        ...patch,
        blocks: nextBlocks,
        content: blocksToPlainText(nextBlocks),
      });
      setSaveState("saved");
    }, 450);
  }

  async function handleTrash() {
    if (readOnly) return;
    try {
      await trashNote({ id: noteId });
      toast.success("Moved to bin");
      onNavigate(null);
    } catch {
      toast.error("Couldn’t move to bin");
    }
  }

  async function handleDuplicate() {
    if (readOnly) return;
    try {
      const id = await duplicateNote({ id: noteId });
      toast.success("Duplicated");
      onNavigate(id);
    } catch {
      toast.error("Couldn’t duplicate");
    }
  }

  async function handleTogglePin() {
    if (!note || readOnly) return;
    try {
      await updateNote({ id: note._id, pinned: !note.pinned });
      toast.success(note.pinned ? "Removed from favorites" : "Added to favorites");
    } catch {
      toast.error("Couldn’t update favorite");
    }
  }

  if (note === undefined) {
    return <div className="page-empty text-muted">Loading…</div>;
  }

  if (note === null) {
    return <div className="page-empty text-muted">Not found</div>;
  }

  const linkablePages =
    allNotes?.filter((n) => n.kind !== "folder" && n._id !== noteId) ?? [];

  return (
    <div className="page-view">
      {readOnly && !isFolder(note) && (
        <div className="readonly-banner">
          <Eye className="size-4 shrink-0" />
          Read-only access — viewing shared content
        </div>
      )}

      <header className="page-topbar">
        <div className="flex min-w-0 items-center gap-2">
          {sidebarCollapsed && (
            <UiTooltip label="Open sidebar">
              <button type="button" className="topbar-btn" onClick={onToggleSidebar} aria-label="Open sidebar">
                <PanelLeft className="size-4" />
              </button>
            </UiTooltip>
          )}
          <PageBreadcrumbs noteId={noteId} onNavigate={onNavigate} compact />
        </div>
        <div className="flex items-center gap-1">
          {!isFolder(note) && !readOnly && (
            <span className="topbar-status">{saveState === "saving" ? "Saving…" : "Saved"}</span>
          )}
          {!readOnly && (
            <UiTooltip label="Share">
              <button type="button" className="topbar-btn" aria-label="Share" onClick={() => setShareOpen(true)}>
                <Share2 className="size-4" />
              </button>
            </UiTooltip>
          )}
          {!isFolder(note) && !readOnly && (
            <UiTooltip label="Duplicate">
              <button type="button" className="topbar-btn" aria-label="Duplicate" onClick={handleDuplicate}>
                <Copy className="size-4" />
              </button>
            </UiTooltip>
          )}
          {!readOnly && (
            <UiTooltip label={note.pinned ? "Remove from favorites" : "Add to favorites"}>
              <button
                type="button"
                className={`topbar-btn ${note.pinned ? "text-accent" : ""}`}
                aria-label={note.pinned ? "Remove from favorites" : "Add to favorites"}
                onClick={handleTogglePin}
              >
                <Pin className={`size-4 ${note.pinned ? "fill-current" : ""}`} />
              </button>
            </UiTooltip>
          )}
          {!readOnly && (
            <UiTooltip label="Move to bin">
              <button type="button" className="topbar-btn text-red-400" aria-label="Move to bin" onClick={handleTrash}>
                <Trash2 className="size-4" />
              </button>
            </UiTooltip>
          )}
          <UiTooltip label="More actions">
            <button type="button" className="topbar-btn" aria-label="More actions">
              <MoreHorizontal className="size-4" />
            </button>
          </UiTooltip>
        </div>
      </header>

      {isFolder(note) ? (
        <CollectionDetail
          folder={note}
          ownerId={ownerId}
          onNavigate={onNavigate}
          onCreateEntry={onCreateEntry}
          onCreateCollection={onCreateCollection}
        />
      ) : (
        <div className="page-scroll note-scroll">
          <div className="group/page relative">
            {note.coverImage ? (
              <div
                className="page-cover page-cover-image"
                style={{ backgroundImage: `url(${note.coverImage})` }}
              />
            ) : note.coverColor ? (
              <div className={`page-cover bg-gradient-to-r ${note.coverColor}`} />
            ) : (
              <div className="page-cover-placeholder" />
            )}
            {!readOnly && (
              <PageHeaderActions
                hasCover={!!(note.coverColor || note.coverImage)}
                hasIcon={showIcon}
                coverValue={note.coverColor}
                coverImage={note.coverImage}
                onAddIcon={() => setShowIcon(true)}
                onAddCover={(cover) => scheduleSave({ coverColor: cover, coverImage: null })}
                onSetCoverImage={(url) =>
                  scheduleSave({
                    coverImage: url,
                    coverColor: url ? null : note.coverColor ?? null,
                  })
                }
                onRemoveCover={() => scheduleSave({ coverColor: null, coverImage: null })}
              />
            )}
          </div>

          <article className="page-content">
            {showIcon && (
              <div
                className={`page-icon-wrap ${
                  note.coverColor || note.coverImage ? "page-icon-over-cover" : ""
                }`}
              >
                <IconPicker
                  value={note.icon}
                  onChange={(icon) => !readOnly && updateNote({ id: note._id, icon })}
                />
              </div>
            )}

            <textarea
              aria-label="Entry title"
              className="page-title"
              value={title}
              rows={1}
              readOnly={readOnly}
              placeholder="Untitled"
              onChange={(e) => {
                setTitle(e.target.value);
                scheduleSave({ title: e.target.value });
              }}
            />

            <PageProperties
              tags={tags}
              updatedAt={note.updatedAt}
              readOnly={readOnly}
              onChange={(next) => {
                setTags(next);
                scheduleSave({ tags: next });
              }}
            />

            <div className="page-body">
              <VaultEditor
                blocks={blocks}
                readOnly={readOnly}
                linkablePages={linkablePages}
                onNavigate={onNavigate}
                onChange={(next) => {
                  setBlocks(next);
                  scheduleSave({ blocks: next });
                }}
              />
            </div>

            {children && children.length > 0 && (
              <section className="page-children">
                <p className="page-children-label">Nested items</p>
                <div className="page-children-list">
                  {children.map((child) => (
                    <ChildCard
                      key={child._id}
                      child={child}
                      readOnly={readOnly}
                      onNavigate={onNavigate}
                      onTrash={async () => {
                        try {
                          await trashNote({ id: child._id });
                          toast.success("Moved to bin");
                        } catch {
                          toast.error("Couldn’t move to bin");
                        }
                      }}
                    />
                  ))}
                </div>
              </section>
            )}
          </article>
        </div>
      )}

      <SharePanel
        ownerId={ownerId}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        scope={isFolder(note) ? "collection" : "entry"}
        noteId={noteId}
        title={note.title}
      />
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
    <div className="page-child-card">
      <button
        type="button"
        className="page-child-main"
        onClick={() => onNavigate(child._id)}
      >
        <span className="text-xl">{child.icon}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {child.title || "Untitled"}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted" />
      </button>
      {!readOnly && (
        <button
          type="button"
          className="page-child-trash"
          aria-label="Move to bin"
          title="Move to bin"
          onClick={(e) => {
            e.stopPropagation();
            onTrash();
          }}
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}
