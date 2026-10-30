"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileText,
  GitFork,
  HardDrive,
  Home,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Trash2,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "cn";
import type { Note } from "@/domain/note";
import type { Folder, Workspace } from "@/domain/shelf";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VaultNameDialog } from "./vault-name-dialog";
import { VaultSearchDialog } from "./vault-search-dialog";

export type VaultView =
  | "pages"
  | "calendar"
  | "settings"
  | "storage"
  | "lab"
  | "trash"
  | "map";

export type CreatePageInput = {
  folderId?: string | null;
  title: string;
};

function SidebarRow({
  active,
  onClick,
  leading,
  label,
  trailing,
  depth = 0,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  leading: React.ReactNode;
  label: React.ReactNode;
  trailing?: React.ReactNode;
  depth?: number;
  className?: string;
}) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={{ paddingLeft: 8 + depth * 14 }}
      className={cn(
        "group/row relative flex h-[30px] w-full cursor-pointer items-center gap-1 rounded-[6px] pr-1 text-[14px] text-sidebar-foreground transition-[background-color,transform,box-shadow] duration-200 select-none",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--primary)]"
          : "hover:bg-sidebar-accent/70 hover:translate-x-px",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-[22px] shrink-0 items-center justify-center text-[14px] text-sidebar-foreground/70 transition-transform duration-200",
          active && "scale-105",
        )}
      >
        {leading}
      </span>
      <span className="min-w-0 flex-1 truncate text-left leading-none">
        {label}
      </span>
      {trailing ? (
        <span
          className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {trailing}
        </span>
      ) : null}
    </div>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className="flex size-[22px] items-center justify-center rounded-[4px] text-sidebar-foreground/45 hover:bg-sidebar-accent hover:text-sidebar-foreground/80 disabled:opacity-40"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function VaultSidebar({
  workspaces,
  activeWorkspaceId,
  folders,
  notes,
  selectedId,
  expandedFolderIds,
  view,
  marks,
  onSelectWorkspace,
  onSelectNote,
  onToggleFolder,
  onExpandFolder,
  onCreateNote,
  onCreateFolder,
  onCreateWorkspace,
  onTrashNote,
  onTrashFolder,
  onChangeView,
  creating,
}: {
  workspaces: readonly Workspace[];
  activeWorkspaceId: string;
  folders: readonly Folder[];
  notes: readonly Note[];
  selectedId?: string;
  expandedFolderIds: ReadonlySet<string>;
  view: VaultView;
  marks: readonly string[];
  onSelectWorkspace: (id: string) => void;
  onSelectNote: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onExpandFolder: (id: string) => void;
  onCreateNote: (input: CreatePageInput) => void;
  onCreateFolder: (name: string) => void;
  onCreateWorkspace: (name: string) => void;
  onTrashNote: (id: string) => void;
  onTrashFolder: (id: string) => void;
  onChangeView: (view: VaultView) => void;
  creating: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [searchOpen, setSearchOpen] = useState(false);
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [pageFolderId, setPageFolderId] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
    workspaces[0];

  const trashCount =
    folders.filter((folder) => folder.deletedAt != null).length +
    notes.filter((note) => note.deletedAt != null).length;

  const workspaceFolders = folders.filter(
    (folder) =>
      folder.workspaceId === activeWorkspaceId && folder.deletedAt == null,
  );
  const rootNotes = notes.filter(
    (note) =>
      note.workspaceId === activeWorkspaceId &&
      note.folderId === null &&
      note.deletedAt == null,
  );
  const isEmpty = workspaceFolders.length === 0 && rootNotes.length === 0;

  const openPageDialog = (folderId: string | null = null) => {
    setPageFolderId(folderId);
    setPageDialogOpen(true);
  };

  return (
    <>
      <motion.aside
        initial={reduceMotion ? false : { opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="hidden h-full w-[240px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex lg:w-[252px]"
      >
        <div className="px-2 pt-2.5 pb-1">
          <DropdownMenu>
            <DropdownMenuTrigger className="group flex h-[34px] w-full items-center gap-1.5 rounded-[6px] px-1.5 text-left hover:bg-sidebar-accent">
              <span className="flex size-[18px] items-center justify-center rounded-[4px] bg-sidebar-primary text-[10px] font-semibold text-sidebar-primary-foreground">
                {(activeWorkspace?.name ?? "N").slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium">
                {activeWorkspace?.name ?? "NoteValut"}
              </span>
              <ChevronDown className="size-3.5 text-sidebar-foreground/45 opacity-70 group-hover:opacity-100" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 rounded-[8px] p-1">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 text-[12px] text-muted-foreground">
                  Workspaces
                </DropdownMenuLabel>
                {workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => onSelectWorkspace(workspace.id)}
                    className="gap-2 rounded-[6px] text-[14px]"
                  >
                    <span className="flex size-[18px] items-center justify-center rounded-[4px] bg-primary/10 text-[11px]">
                      {workspace.emoji}
                    </span>
                    <span className="truncate">{workspace.name}</span>
                    {workspace.id === activeWorkspaceId ? (
                      <span className="ml-auto text-[11px] text-muted-foreground">
                        ✓
                      </span>
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setWorkspaceDialogOpen(true)}
                  className="gap-2 rounded-[6px] text-[14px]"
                >
                  <Plus className="size-3.5" />
                  New workspace
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-px px-2 py-1">
          <SidebarRow
            onClick={() => setSearchOpen(true)}
            leading={<Search className="size-3.5 stroke-[1.75]" />}
            label={
              <span className="text-sidebar-foreground/55">
                Search
                <span className="ml-2 rounded border border-sidebar-border px-1 py-px font-mono text-[10px] text-sidebar-foreground/35">
                  ⌘K
                </span>
              </span>
            }
          />
          <SidebarRow
            leading={<Home className="size-3.5 stroke-[1.75]" />}
            label="Home"
            onClick={() => onChangeView("pages")}
            active={view === "pages" && !selectedId}
          />
          <SidebarRow
            leading={<CalendarDays className="size-3.5 stroke-[1.75]" />}
            label="Calendar"
            onClick={() => onChangeView("calendar")}
            active={view === "calendar"}
          />
          <SidebarRow
            leading={<GitFork className="size-3.5 stroke-[1.75]" />}
            label="Map"
            onClick={() => onChangeView("map")}
            active={view === "map"}
          />
          <SidebarRow
            leading={<HardDrive className="size-3.5 stroke-[1.75]" />}
            label="Storage"
            onClick={() => onChangeView("storage")}
            active={view === "storage"}
          />
          <SidebarRow
            leading={<Wrench className="size-3.5 stroke-[1.75]" />}
            label="Lab"
            onClick={() => onChangeView("lab")}
            active={view === "lab"}
          />
          <SidebarRow
            leading={<Settings className="size-3.5 stroke-[1.75]" />}
            label="Settings"
            onClick={() => onChangeView("settings")}
            active={view === "settings"}
          />
        </div>

        <div className="mt-3 flex items-center px-3">
          <p className="flex-1 text-[11px] font-medium tracking-[0.02em] text-sidebar-foreground/45">
            Private
          </p>
          <IconAction
            label="New page"
            disabled={creating}
            onClick={() => openPageDialog(null)}
          >
            <Plus className="size-3.5" />
          </IconAction>
          <IconAction
            label="New folder"
            disabled={creating}
            onClick={() => setFolderDialogOpen(true)}
          >
            <span className="text-[13px] leading-none">📁</span>
          </IconAction>
        </div>

        <ScrollArea className="mt-1 min-h-0 flex-1 px-2 pb-2">
          <div className="space-y-px pb-3">
            {isEmpty ? (
              <div className="mx-1 mt-1 rounded-[8px] px-2 py-3">
                <p className="text-[13px] text-sidebar-foreground/55">
                  No pages inside
                </p>
                <button
                  type="button"
                  onClick={() => openPageDialog(null)}
                  className="mt-2 flex h-[28px] w-full items-center gap-1.5 rounded-[6px] px-1.5 text-[13px] text-sidebar-foreground/55 hover:bg-sidebar-accent"
                >
                  <Plus className="size-3.5" />
                  Add a page
                </button>
                <button
                  type="button"
                  onClick={() => setFolderDialogOpen(true)}
                  className="mt-0.5 flex h-[28px] w-full items-center gap-1.5 rounded-[6px] px-1.5 text-[13px] text-sidebar-foreground/55 hover:bg-sidebar-accent"
                >
                  <Plus className="size-3.5" />
                  Add a folder
                </button>
              </div>
            ) : null}

            {workspaceFolders.map((folder) => {
              const open = expandedFolderIds.has(folder.id);
              const folderNotes = notes.filter(
                (note) =>
                  note.folderId === folder.id && note.deletedAt == null,
              );

              return (
                <div key={folder.id}>
                  <SidebarRow
                    onClick={() => onToggleFolder(folder.id)}
                    leading={
                      <span className="relative flex size-full items-center justify-center">
                        <span className="group-hover/row:hidden">
                          {folder.emoji || "📁"}
                        </span>
                        <span className="absolute inset-0 hidden items-center justify-center group-hover/row:flex">
                          {open ? (
                            <ChevronDown className="size-3.5 text-sidebar-foreground/55" />
                          ) : (
                            <ChevronRight className="size-3.5 text-sidebar-foreground/55" />
                          )}
                        </span>
                      </span>
                    }
                    label={folder.name}
                    trailing={
                      <>
                        <IconAction
                          label="Add a page inside"
                          disabled={creating}
                          onClick={() => openPageDialog(folder.id)}
                        >
                          <Plus className="size-3.5" />
                        </IconAction>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <button
                                type="button"
                                aria-label="Folder actions"
                                className="flex size-[22px] items-center justify-center rounded-[4px] text-sidebar-foreground/45 hover:bg-sidebar-accent hover:text-sidebar-foreground/80"
                              />
                            }
                          >
                            <MoreHorizontal className="size-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="w-48 rounded-[8px] p-1"
                          >
                            <DropdownMenuItem
                              onClick={() => openPageDialog(folder.id)}
                              className="gap-2 rounded-[6px] text-[13px]"
                            >
                              <Plus className="size-3.5" />
                              Add page
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => onTrashFolder(folder.id)}
                              className="gap-2 rounded-[6px] text-[13px]"
                            >
                              <Trash2 className="size-3.5" />
                              Move to trash
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    }
                  />

                  <AnimatePresence initial={false}>
                    {open ? (
                      <motion.div
                        key="children"
                        initial={
                          reduceMotion ? false : { height: 0, opacity: 0 }
                        }
                        animate={{ height: "auto", opacity: 1 }}
                        exit={
                          reduceMotion
                            ? undefined
                            : { height: 0, opacity: 0 }
                        }
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        {folderNotes.length === 0 ? (
                          <SidebarRow
                            depth={1}
                            onClick={() => openPageDialog(folder.id)}
                            leading={
                              <FileText className="size-3.5 stroke-[1.6] text-sidebar-foreground/35" />
                            }
                            label={
                              <span className="text-sidebar-foreground/40">
                                New page
                              </span>
                            }
                          />
                        ) : (
                          folderNotes.map((note, index) => (
                            <SidebarRow
                              key={note.id}
                              depth={1}
                              active={
                                note.id === selectedId && view === "pages"
                              }
                              onClick={() => {
                                onSelectNote(note.id);
                                onChangeView("pages");
                              }}
                              leading={
                                <span aria-hidden>
                                  {marks[index % marks.length] ?? "📄"}
                                </span>
                              }
                              label={note.title || "Untitled"}
                              trailing={
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <button
                                        type="button"
                                        aria-label="Page actions"
                                        className="flex size-[22px] items-center justify-center rounded-[4px] text-sidebar-foreground/45 hover:bg-sidebar-accent hover:text-sidebar-foreground/80"
                                      />
                                    }
                                  >
                                    <MoreHorizontal className="size-3.5" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="start"
                                    className="w-44 rounded-[8px] p-1"
                                  >
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() => onTrashNote(note.id)}
                                      className="gap-2 rounded-[6px] text-[13px]"
                                    >
                                      <Trash2 className="size-3.5" />
                                      Move to trash
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              }
                            />
                          ))
                        )}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}

            {rootNotes.map((note, index) => (
              <SidebarRow
                key={note.id}
                active={note.id === selectedId && view === "pages"}
                onClick={() => {
                  onSelectNote(note.id);
                  onChangeView("pages");
                }}
                leading={
                  <span aria-hidden>
                    {marks[index % marks.length] ?? "📄"}
                  </span>
                }
                label={note.title || "Untitled"}
                trailing={
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          aria-label="Page actions"
                          className="flex size-[22px] items-center justify-center rounded-[4px] text-sidebar-foreground/45 hover:bg-sidebar-accent hover:text-sidebar-foreground/80"
                        />
                      }
                    >
                      <MoreHorizontal className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-44 rounded-[8px] p-1"
                    >
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onTrashNote(note.id)}
                        className="gap-2 rounded-[6px] text-[13px]"
                      >
                        <Trash2 className="size-3.5" />
                        Move to trash
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
              />
            ))}

            {!isEmpty ? (
              <SidebarRow
                onClick={() => openPageDialog(null)}
                leading={<Plus className="size-3.5 text-sidebar-foreground/45" />}
                label={
                  <span className="text-sidebar-foreground/45">Add a page</span>
                }
              />
            ) : null}
          </div>
        </ScrollArea>

        <div className="mt-auto space-y-px border-t border-sidebar-border px-2 py-2">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-[11px] text-sidebar-foreground/40">Theme</span>
            <ThemeToggle compact />
          </div>
          <SidebarRow
            leading={<Trash2 className="size-3.5 stroke-[1.75]" />}
            label={
              <span className="flex w-full items-center justify-between gap-2 text-sidebar-foreground/55">
                Trash
                {trashCount > 0 ? (
                  <span className="rounded-[4px] bg-sidebar-accent px-1.5 font-mono text-[10px] text-sidebar-foreground/70">
                    {trashCount}
                  </span>
                ) : null}
              </span>
            }
            onClick={() => onChangeView("trash")}
            active={view === "trash"}
          />
          <Link
            href="/"
            className="flex h-[30px] items-center gap-1 rounded-[6px] px-2 text-[13px] text-sidebar-foreground/45 hover:bg-sidebar-accent hover:text-sidebar-foreground/75"
          >
            ← Back to site
          </Link>
        </div>
      </motion.aside>

      <VaultSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        workspaces={workspaces}
        folders={folders}
        notes={notes}
        onSelectNote={onSelectNote}
        onSelectWorkspace={onSelectWorkspace}
        onSelectFolder={onExpandFolder}
        onChangeView={onChangeView}
      />

      <VaultNameDialog
        open={workspaceDialogOpen}
        onOpenChange={setWorkspaceDialogOpen}
        title="Create workspace"
        description="Workspaces keep folders and pages separate — like Personal vs client work."
        placeholder="Personal, Acme, Research…"
        confirmLabel="Create workspace"
        onConfirm={onCreateWorkspace}
      />
      <VaultNameDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        title="Create folder"
        description={`Adds a folder inside “${activeWorkspace?.name ?? "this workspace"}”.`}
        placeholder="Ideas, Projects, Archive…"
        confirmLabel="Create folder"
        onConfirm={onCreateFolder}
      />
      <VaultNameDialog
        open={pageDialogOpen}
        onOpenChange={setPageDialogOpen}
        title="Create page"
        description={
          pageFolderId
            ? "New page inside the selected folder."
            : "New page at the workspace root."
        }
        placeholder="Meeting notes, Brief, Inbox…"
        confirmLabel="Create page"
        defaultValue="Untitled"
        onConfirm={(title) =>
          onCreateNote({ folderId: pageFolderId, title })
        }
      />
    </>
  );
}
