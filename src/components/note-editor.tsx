"use client";

import { useMutation, useQuery } from "convex/react";
import {
  ChevronRight,
  Copy,
  Eye,
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
  blocksToMarkdown,
  blocksToPlainText,
  defaultBlocks,
  migrateContentToBlocks,
} from "@/lib/blocks";
import { isFolder } from "@/lib/item-kinds";
import { firstIssue, parseBlocks, parseTags, parseTemplateName } from "@/lib/validation";
import { useVaultAccess } from "@/context/vault-access";
import { TableOfContents } from "./table-of-contents";
import { BacklinksPanel } from "./backlinks-panel";
import { PagePins } from "./page-pins";
import { VaultEditor } from "@/editor";
import { saveCustomTemplate } from "@/db/templates-collection";
import { CollectionDetail } from "./collection-detail";
import { IconPicker } from "./icon-picker";
import { MoreActionIcons, MoreActionsMenu, type MoreActionItem } from "./more-actions-menu";
import { MoveDialog } from "./move-dialog";
import { PageBreadcrumbs } from "./page-breadcrumbs";
import { PageHeaderActions } from "./page-header-actions";
import { PageProperties } from "./page-properties";
import { SharePanel } from "./share-panel";
import { useToast } from "./toast";
import { UiTooltip } from "./ui-tooltip";
import { VersionHistoryPanel } from "./version-history-panel";

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
  const [moveOpen, setMoveOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
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

  async function handleToggleArchive() {
    if (!note || readOnly) return;
    try {
      await updateNote({ id: note._id, archived: !note.archived });
      toast.success(note.archived ? "Unarchived" : "Archived");
      if (!note.archived) onNavigate(null);
    } catch {
      toast.error("Couldn’t update archive");
    }
  }

  async function copyMarkdown() {
    const md = `# ${title || "Untitled"}\n\n${blocksToMarkdown(blocks)}`;
    try {
      await navigator.clipboard.writeText(md);
      toast.success("Copied as Markdown");
    } catch {
      toast.error("Couldn’t copy");
    }
  }

  function downloadMarkdown() {
    const md = `# ${title || "Untitled"}\n\n${blocksToMarkdown(blocks)}`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "untitled").replace(/[^\w\-]+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded Markdown");
  }

  async function copyPageUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn’t copy link");
    }
  }

  function saveAsTemplate() {
    if (!note || isFolder(note) || readOnly) return;
    const nameResult = parseTemplateName(title || note.icon || "Untitled template");
    if (!nameResult.success) {
      toast.error(firstIssue(nameResult));
      return;
    }
    const blocksResult = parseBlocks(blocks.length ? blocks : defaultBlocks());
    if (!blocksResult.success) {
      toast.error(firstIssue(blocksResult));
      return;
    }
    saveCustomTemplate({
      id: `custom-${crypto.randomUUID()}`,
      name: nameResult.output,
      icon: note.icon || "✦",
      description: "Saved from your vault",
      tags: [...tags],
      blocks: blocksResult.output.map((b) => ({
        ...b,
        id: crypto.randomUUID(),
        rows: b.rows?.map((row) => [...row]),
      })),
    });
    toast.success(`Template “${nameResult.output}” saved`);
  }

  if (note === undefined) {
    return <div className="page-empty text-muted">Loading…</div>;
  }

  if (note === null) {
    return <div className="page-empty text-muted">Not found</div>;
  }

  const linkablePages =
    allNotes?.filter((n) => n.kind !== "folder" && n._id !== noteId) ?? [];

  const moreItems: MoreActionItem[] = [];
  if (!readOnly) {
    if (!isFolder(note)) {
      moreItems.push(
        {
          id: "copy-md",
          label: "Copy as Markdown",
          icon: MoreActionIcons.copy,
          onClick: () => void copyMarkdown(),
        },
        {
          id: "download-md",
          label: "Download Markdown",
          icon: MoreActionIcons.download,
          onClick: downloadMarkdown,
        },
        {
          id: "save-template",
          label: "Save as template",
          icon: MoreActionIcons.template,
          onClick: saveAsTemplate,
        },
        {
          id: "history",
          label: "Version history",
          icon: MoreActionIcons.history,
          onClick: () => setHistoryOpen(true),
        },
      );
    }
    moreItems.push({
      id: "copy-link",
      label: "Copy page link",
      icon: MoreActionIcons.link,
      onClick: () => void copyPageUrl(),
    });
    if (!isFolder(note)) {
      moreItems.push({
        id: "toggle-icon",
        label: showIcon ? "Hide icon" : "Show icon",
        icon: showIcon ? MoreActionIcons.hideIcon : MoreActionIcons.showIcon,
        onClick: () => setShowIcon((v) => !v),
      });
    }
    moreItems.push(
      {
        id: "move",
        label: "Move to…",
        icon: MoreActionIcons.move,
        onClick: () => setMoveOpen(true),
      },
      {
        id: "nested-entry",
        label: "New nested entry",
        icon: MoreActionIcons.entry,
        onClick: () => onCreateEntry(noteId),
      },
      {
        id: "nested-collection",
        label: "New nested collection",
        icon: MoreActionIcons.collection,
        onClick: () => onCreateCollection(noteId),
      },
      {
        id: "archive",
        label: note.archived ? "Unarchive" : "Archive",
        icon: note.archived ? MoreActionIcons.unarchive : MoreActionIcons.archive,
        onClick: () => void handleToggleArchive(),
      },
    );
  } else {
    moreItems.push({
      id: "copy-link",
      label: "Copy page link",
      icon: MoreActionIcons.link,
      onClick: () => void copyPageUrl(),
    });
    if (!isFolder(note)) {
      moreItems.push(
        {
          id: "copy-md",
          label: "Copy as Markdown",
          icon: MoreActionIcons.copy,
          onClick: () => void copyMarkdown(),
        },
        {
          id: "history",
          label: "Version history",
          icon: MoreActionIcons.history,
          onClick: () => setHistoryOpen(true),
        },
      );
    }
  }

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
          <MoreActionsMenu items={moreItems} />
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

            <PagePins
              blocks={blocks}
              onJump={(blockId) => {
                const el = document.querySelector<HTMLElement>(`[data-block-id="${blockId}"]`);
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
                el?.focus();
              }}
            />

            <div className="page-body-layout">
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
                <BacklinksPanel
                  ownerId={ownerId}
                  noteId={noteId}
                  onNavigate={onNavigate}
                />
              </div>
              <TableOfContents
                blocks={blocks}
                onJump={(blockId) => {
                  const el = document.querySelector<HTMLElement>(`[data-block-id="${blockId}"]`);
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.focus();
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
      {!readOnly && (
        <MoveDialog
          open={moveOpen}
          onClose={() => setMoveOpen(false)}
          ownerId={ownerId}
          noteId={noteId}
          noteTitle={note.title}
          currentParentId={note.parentId ?? null}
        />
      )}
      {!isFolder(note) && (
        <VersionHistoryPanel
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          noteId={noteId}
          readOnly={readOnly}
        />
      )}
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
