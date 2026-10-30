"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FileText, Folder, RotateCcw, Trash2 } from "lucide-react";
import type { Note } from "@/domain/note";
import type { Folder as ShelfFolder, Workspace } from "@/domain/shelf";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollPane } from "./scroll-to-top";

function formatDeletedAt(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type TrashItem =
  | {
      kind: "page";
      id: string;
      title: string;
      subtitle: string;
      deletedAt: number;
      note: Note;
    }
  | {
      kind: "folder";
      id: string;
      title: string;
      subtitle: string;
      deletedAt: number;
      folder: ShelfFolder;
      pageCount: number;
    };

export function VaultTrash({
  workspaces,
  folders,
  notes,
  onRestoreNote,
  onRestoreFolder,
  onPermanentDeleteNote,
  onPermanentDeleteFolder,
  busy,
}: {
  workspaces: readonly Workspace[];
  folders: readonly ShelfFolder[];
  notes: readonly Note[];
  onRestoreNote: (id: string) => void;
  onRestoreFolder: (id: string) => void;
  onPermanentDeleteNote: (id: string) => void;
  onPermanentDeleteFolder: (id: string) => void;
  busy?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  const workspaceName = (id: string) =>
    workspaces.find((workspace) => workspace.id === id)?.name ?? "Workspace";

  const trashedFolders = folders.filter((folder) => folder.deletedAt != null);
  const trashedNotes = notes.filter((note) => note.deletedAt != null);

  const items: TrashItem[] = [
    ...trashedFolders.map((folder) => ({
      kind: "folder" as const,
      id: folder.id,
      title: `${folder.emoji} ${folder.name}`,
      subtitle: workspaceName(folder.workspaceId),
      deletedAt: folder.deletedAt as number,
      folder,
      pageCount: notes.filter(
        (note) => note.folderId === folder.id && note.deletedAt != null,
      ).length,
    })),
    ...trashedNotes
      .filter((note) => {
        if (!note.folderId) return true;
        const parent = folders.find((folder) => folder.id === note.folderId);
        return !parent || parent.deletedAt == null;
      })
      .map((note) => ({
        kind: "page" as const,
        id: note.id,
        title: note.title || "Untitled",
        subtitle: workspaceName(note.workspaceId),
        deletedAt: note.deletedAt as number,
        note,
      })),
  ].sort((a, b) => b.deletedAt - a.deletedAt);

  return (
    <section className="relative flex min-h-full min-w-0 flex-1 flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 40% at 10% 0%, color-mix(in oklch, var(--destructive) 12%, transparent), transparent 55%), radial-gradient(ellipse 50% 30% at 90% 100%, color-mix(in oklch, var(--muted-foreground) 8%, transparent), transparent 50%)",
        }}
      />

      <header className="relative z-10 border-b border-border px-6 py-5 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              Soft delete
            </p>
            <h1 className="mt-1 font-display text-3xl tracking-tight text-foreground md:text-4xl">
              Trash
            </h1>
            <p className="mt-2 max-w-lg text-[14px] text-muted-foreground">
              Pages and folders stay here until you restore them or erase them
              for good.
            </p>
          </div>
          <Badge variant="secondary" className="rounded-[6px] font-mono text-[11px]">
            {items.length} item{items.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </header>

      <ScrollPane className="relative z-10 px-6 py-6 md:px-10">
        {items.length === 0 ? (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-[12px] border border-dashed border-border bg-card/40 px-6 text-center">
            <Trash2 className="size-8 text-muted-foreground/40" />
            <p className="mt-4 font-display text-xl text-foreground">
              Trash is empty
            </p>
            <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">
              Move a page or folder to trash from the sidebar — it will land
              here first.
            </p>
          </div>
        ) : (
          <ul className="mx-auto max-w-2xl space-y-2">
            <AnimatePresence initial={false}>
              {items.map((item, index) => (
                <motion.li
                  key={`${item.kind}-${item.id}`}
                  layout={!reduceMotion}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
                  transition={{
                    duration: 0.22,
                    delay: reduceMotion ? 0 : index * 0.03,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex flex-col gap-3 rounded-[10px] border border-border bg-card/80 px-4 py-3 shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-muted text-muted-foreground">
                      {item.kind === "folder" ? (
                        <Folder className="size-4" />
                      ) : (
                        <FileText className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {item.kind === "folder" ? "Folder" : "Page"} ·{" "}
                        {item.subtitle}
                        {item.kind === "folder" && item.pageCount > 0
                          ? ` · ${item.pageCount} page${item.pageCount === 1 ? "" : "s"}`
                          : null}
                      </p>
                      <p className="mt-1 font-mono text-[10px] tracking-wide text-muted-foreground/70">
                        Deleted {formatDeletedAt(item.deletedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        item.kind === "folder"
                          ? onRestoreFolder(item.id)
                          : onRestoreNote(item.id)
                      }
                      className="h-8 gap-1.5 rounded-[6px] text-[13px]"
                    >
                      <RotateCcw className="size-3.5" />
                      Restore
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        const label =
                          item.kind === "folder"
                            ? `Permanently delete folder “${item.folder.name}” and its trashed pages?`
                            : `Permanently delete “${item.title}”?`;
                        if (!window.confirm(label)) return;
                        if (item.kind === "folder") {
                          onPermanentDeleteFolder(item.id);
                        } else {
                          onPermanentDeleteNote(item.id);
                        }
                      }}
                      className="h-8 gap-1.5 rounded-[6px] text-[13px]"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        <Separator className="mx-auto mt-10 max-w-2xl" />
        <p className="mx-auto mt-4 max-w-2xl text-[12px] text-muted-foreground">
          Permanent delete removes the row from Appwrite. Restore clears{" "}
          <code className="rounded bg-muted px-1 py-px font-mono text-[11px]">
            deletedAt
          </code>{" "}
          and puts the item back in the sidebar.
        </p>
      </ScrollPane>
    </section>
  );
}
