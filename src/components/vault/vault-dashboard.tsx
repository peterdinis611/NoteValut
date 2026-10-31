"use client";

import { useAppwrite, useUser } from "@appwrite.io/react";
import { Effect } from "effect";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  createNote,
  restoreNote,
  softDeleteNote,
  updateNote,
  type Note,
} from "@/domain/note";
import {
  createCalendarEvent,
  createFolder,
  createWorkspace,
  restoreFolder,
  softDeleteFolder,
  type CalendarEvent,
  type EventTone,
  type Folder,
  type Workspace,
  type WorkspaceId,
} from "@/domain/shelf";
import {
  loadShelf,
  permanentlyDeleteFolder,
  permanentlyDeletePage,
  persistFolder,
  persistFolderDeletedAt,
  persistPage,
  persistPageUpdate,
  persistWorkspace,
} from "@/lib/appwrite/shelf";
import { runPromise, runSync } from "@/lib/effect";
import {
  clampSidebarWidth,
  loadVaultPreferences,
  patchVaultPreferences,
  subscribeVaultPreferences,
  type VaultPreferences,
} from "@/lib/vault-preferences";
import { getPageTemplate } from "@/lib/vault/page-templates";
import { VaultCalendar } from "./vault-calendar";
import { VaultLab } from "./vault-lab";
import { VaultEditor } from "./vault-editor";
import { VaultMap } from "./vault-map";
import { VaultNameDialog } from "./vault-name-dialog";
import { VaultPreload } from "./vault-preload";
import { VaultSettings } from "./vault-settings";
import {
  VaultSidebar,
  type CreatePageInput,
  type VaultView,
} from "./vault-sidebar";
import { VaultStorage } from "./vault-storage";
import { VaultTemplates } from "./vault-templates";
import { VaultTrash } from "./vault-trash";
import { VaultGlobalScrollToTop } from "./scroll-to-top";

const personal = runSync(createWorkspace({ name: "Personal", emoji: "🏠" }));
const acme = runSync(createWorkspace({ name: "Acme Inc.", emoji: "🎯" }));

const ideasFolder = runSync(
  createFolder({
    workspaceId: personal.id,
    name: "Ideas",
    emoji: "💡",
  }),
);
const projectsFolder = runSync(
  createFolder({
    workspaceId: acme.id,
    name: "Projects",
    emoji: "📁",
  }),
);

const seedNotesBase: Note[] = [
  runSync(
    createNote({
      workspaceId: acme.id,
      folderId: projectsFolder.id,
      title: "Quick Notes",
      body: "NoteValut is the quiet shelf where better notes stay found — typed with Effect, signed in with Appwrite.\n\n- [x] Setting up research meeting\n- [ ] Make the logo bigger\n- [ ] Check to-do's\n- [x] Get feedback on website design\n\nBrief\nCapture the next sprint: ship email verification, then persist notes into Appwrite tables without losing the soft editor feel.",
      tags: ["morning", "ideas", "to-do's"],
    }),
  ),
  runSync(
    createNote({
      workspaceId: acme.id,
      folderId: projectsFolder.id,
      title: "Tasks",
      body: "Today’s shelf.\n\n- [ ] Review signup email flow\n- [ ] Polish vault spacing\n- [x] Land workspace folders",
      tags: ["tasks"],
    }),
  ),
  runSync(
    createNote({
      workspaceId: personal.id,
      folderId: ideasFolder.id,
      title: "Morning capture",
      body: "Quiet ideas before the day gets loud.",
      tags: ["morning"],
    }),
  ),
  runSync(
    createNote({
      workspaceId: personal.id,
      folderId: null,
      title: "Inbox",
      body: "Loose pages live at the workspace root.",
      tags: ["inbox"],
    }),
  ),
];

const seedNotes: Note[] = (() => {
  const [quick, tasks, ...rest] = seedNotesBase;
  if (!quick || !tasks) return seedNotesBase;
  return [
    { ...quick, linkedNoteIds: [tasks.id] },
    { ...tasks, linkedNoteIds: [quick.id] },
    ...rest,
  ];
})();

const seedEvents: CalendarEvent[] = [
  runSync(
    createCalendarEvent({
      workspaceId: acme.id,
      title: "Design review",
      day: new Date().toISOString().slice(0, 10),
      noteId: seedNotes[0]?.id ?? null,
      tone: "urgent",
    }),
  ),
  runSync(
    createCalendarEvent({
      workspaceId: personal.id,
      title: "Write morning note",
      day: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
      })(),
      noteId: seedNotes[2]?.id ?? null,
      tone: "calm",
    }),
  ),
  runSync(
    createCalendarEvent({
      workspaceId: acme.id,
      title: "Deep work block",
      day: new Date().toISOString().slice(0, 10),
      tone: "focus",
    }),
  ),
];

const noteMarks = ["🎯", "🤩", "⏱", "💻", "🔐", "☀️", "🧩"] as const;

const runTagged = <A,>(
  effect: Effect.Effect<A, { message: string }>,
): { ok: true; value: A } | { ok: false; message: string } =>
  Effect.runSync(
    effect.pipe(
      Effect.map((value) => ({ ok: true as const, value })),
      Effect.catch((err) =>
        Effect.succeed({ ok: false as const, message: err.message }),
      ),
    ),
  );

const runTaggedPromise = async <A,>(
  effect: Effect.Effect<A, { message: string }>,
): Promise<{ ok: true; value: A } | { ok: false; message: string }> =>
  Effect.runPromise(
    effect.pipe(
      Effect.map((value) => ({ ok: true as const, value })),
      Effect.catch((err) =>
        Effect.succeed({ ok: false as const, message: err.message }),
      ),
    ),
  );

export function VaultDashboard({
  accountLabel,
  persist = false,
}: {
  accountLabel?: string | null;
  /** When true, load/save workspaces, folders, and pages via Appwrite. */
  persist?: boolean;
}) {
  const { tablesDB } = useAppwrite();
  const { user, isLoading: authLoading } = useUser();
  const ownerId = persist ? user?.$id : undefined;

  const [workspaces, setWorkspaces] = useState<Workspace[]>(
    persist ? [] : [personal, acme],
  );
  const [folders, setFolders] = useState<Folder[]>(
    persist ? [] : [ideasFolder, projectsFolder],
  );
  const [notes, setNotes] = useState<Note[]>(persist ? [] : seedNotes);
  const [events, setEvents] = useState<CalendarEvent[]>(
    persist ? [] : seedEvents,
  );
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(
    persist ? "" : acme.id,
  );
  const [selectedId, setSelectedId] = useState<string>(
    persist ? "" : (seedNotes[0]?.id ?? ""),
  );
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () =>
      persist
        ? new Set()
        : new Set([projectsFolder.id, ideasFolder.id]),
  );
  const [view, setView] = useState<VaultView>("pages");
  const [error, setError] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState(persist);
  const [prefs, setPrefs] = useState<VaultPreferences | null>(null);
  const [createKind, setCreateKind] = useState<
    null | "workspace" | "folder" | "page"
  >(null);
  const [isPending, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedOwner = useRef<string | null>(null);

  useEffect(() => {
    const loaded = loadVaultPreferences();
    setPrefs(loaded);
    if (loaded.openCalendarFirst || loaded.defaultLandingView === "calendar") {
      setView("calendar");
    } else if (
      loaded.defaultLandingView === "lab" ||
      loaded.defaultLandingView === "map"
    ) {
      setView(loaded.defaultLandingView);
    }
  }, []);

  useEffect(() => {
    if (view !== "settings" && view !== "templates") {
      setPrefs(loadVaultPreferences());
    }
  }, [view]);

  useEffect(() => subscribeVaultPreferences(setPrefs), []);

  useEffect(() => {
    if (!persist) return;
    if (authLoading) return;
    if (!ownerId) {
      setHydrating(false);
      setError("Sign in to sync folders and pages to Appwrite.");
      return;
    }
    if (hydratedOwner.current === ownerId) return;

    let cancelled = false;
    setHydrating(true);
    setError(null);

    void (async () => {
      const loaded = await runTaggedPromise(loadShelf(tablesDB, ownerId));
      if (cancelled) return;

      if (!loaded.ok) {
        setError(loaded.message);
        setHydrating(false);
        return;
      }

      let shelf = loaded.value;
      if (shelf.workspaces.length === 0) {
        const created = runTagged(
          createWorkspace({ name: "Personal", emoji: "🏠" }),
        );
        if (!created.ok) {
          setError(created.message);
          setHydrating(false);
          return;
        }
        const saved = await runTaggedPromise(
          persistWorkspace(tablesDB, ownerId, created.value),
        );
        if (!saved.ok) {
          setError(saved.message);
          setHydrating(false);
          return;
        }
        shelf = {
          workspaces: [created.value],
          folders: [],
          notes: [],
        };
      }

      hydratedOwner.current = ownerId;
      setWorkspaces(shelf.workspaces);
      setFolders(shelf.folders);
      setNotes(shelf.notes);
      setExpandedFolderIds(
        new Set(
          shelf.folders
            .filter((folder) => folder.deletedAt == null)
            .map((folder) => folder.id),
        ),
      );
      const firstWorkspace = shelf.workspaces[0];
      setActiveWorkspaceId(firstWorkspace?.id ?? "");
      const activeNotes = shelf.notes.filter((note) => note.deletedAt == null);
      const firstNote =
        activeNotes.find((note) => note.workspaceId === firstWorkspace?.id) ??
        activeNotes[0];
      setSelectedId(firstNote?.id ?? "");
      setHydrating(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, ownerId, persist, tablesDB]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const activeNotes = useMemo(
    () => notes.filter((note) => note.deletedAt == null),
    [notes],
  );
  const workspaceNotes = useMemo(
    () =>
      activeNotes.filter((note) => note.workspaceId === activeWorkspaceId),
    [activeNotes, activeWorkspaceId],
  );
  const workspaceEvents = useMemo(
    () => events.filter((event) => event.workspaceId === activeWorkspaceId),
    [activeWorkspaceId, events],
  );

  const selected =
    activeNotes.find((note) => note.id === selectedId) ?? workspaceNotes[0];
  const selectedMark =
    noteMarks[
      Math.max(
        0,
        workspaceNotes.findIndex((note) => note.id === selected?.id),
      ) % noteMarks.length
    ];

  const onSelectWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    const first = activeNotes.find((note) => note.workspaceId === id);
    if (first) setSelectedId(first.id);
    setView("pages");
  };

  const onToggleFolder = (id: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onExpandFolder = (id: string) => {
    setExpandedFolderIds((prev) => new Set(prev).add(id));
  };

  const onCreateWorkspace = (name: string) => {
    setError(null);
    startTransition(() => {
      void (async () => {
        const result = runTagged(createWorkspace({ name, emoji: "🗂" }));
        if (!result.ok) {
          setError(result.message);
          return;
        }
        if (ownerId) {
          const saved = await runTaggedPromise(
            persistWorkspace(tablesDB, ownerId, result.value),
          );
          if (!saved.ok) {
            setError(saved.message);
            return;
          }
        }
        setWorkspaces((prev) => [...prev, result.value]);
        setActiveWorkspaceId(result.value.id);
        setView("pages");
      })();
    });
  };

  const onCreateFolder = (name: string) => {
    if (!activeWorkspaceId) return;
    setError(null);
    startTransition(() => {
      void (async () => {
        const result = runTagged(
          createFolder({
            workspaceId: activeWorkspaceId as WorkspaceId,
            name,
            emoji: "📁",
          }),
        );
        if (!result.ok) {
          setError(result.message);
          return;
        }
        if (ownerId) {
          const saved = await runTaggedPromise(
            persistFolder(tablesDB, ownerId, result.value),
          );
          if (!saved.ok) {
            setError(saved.message);
            return;
          }
        }
        setFolders((prev) => [...prev, result.value]);
        setExpandedFolderIds((prev) => new Set(prev).add(result.value.id));
      })();
    });
  };

  const onCreateNote = (input: CreatePageInput) => {
    if (!activeWorkspaceId) return;
    const folderId = input.folderId ?? null;
    const template = getPageTemplate(input.templateId);
    const body = input.body ?? template.body;
    const tags = input.tags ?? template.tags;
    setError(null);
    startTransition(() => {
      void (async () => {
        const result = runTagged(
          createNote({
            workspaceId: activeWorkspaceId as WorkspaceId,
            folderId: folderId as Note["folderId"],
            title: input.title.trim() || template.suggestedTitle || "Untitled",
            body,
            tags,
          }),
        );
        if (!result.ok) {
          setError(result.message);
          return;
        }
        if (ownerId) {
          const saved = await runTaggedPromise(
            persistPage(tablesDB, ownerId, result.value),
          );
          if (!saved.ok) {
            setError(saved.message);
            return;
          }
        }
        setNotes((prev) => [result.value, ...prev]);
        setSelectedId(result.value.id);
        setView("pages");
        if (folderId) {
          setExpandedFolderIds((prev) => new Set(prev).add(folderId));
        }
      })();
    });
  };

  const schedulePageSave = (note: Note) => {
    if (!ownerId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void runPromise(persistPageUpdate(tablesDB, note)).catch((err: Error) => {
        setError(err.message);
      });
    }, prefs?.autosaveMs ?? 450);
  };

  const onChangeSelected = (patch: {
    title?: string;
    body?: string;
    tags?: string[];
    linkedNoteIds?: string[];
  }) => {
    if (!selected) return;
    setError(null);
    startTransition(() => {
      const result = runTagged(
        updateNote(
          {
            id: selected.id,
            title: patch.title ?? selected.title,
            body: patch.body ?? selected.body,
            tags: patch.tags ?? selected.tags ?? [],
            linkedNoteIds: patch.linkedNoteIds ?? selected.linkedNoteIds ?? [],
          },
          selected,
        ),
      );
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setNotes((prev) =>
        prev.map((note) =>
          note.id === result.value.id ? result.value : note,
        ),
      );
      schedulePageSave(result.value);
    });
  };

  const persistNotePatch = (existing: Note, linkedNoteIds: string[]) => {
    const result = runTagged(
      updateNote(
        {
          id: existing.id,
          title: existing.title,
          body: existing.body,
          tags: [...(existing.tags ?? [])],
          linkedNoteIds,
        },
        existing,
      ),
    );
    if (!result.ok) {
      setError(result.message);
      return null;
    }
    return result.value;
  };

  const onLinkNote = (targetId: string) => {
    if (!selected || selected.id === targetId) return;
    setError(null);
    startTransition(() => {
      const target = notes.find((note) => note.id === targetId);
      if (!target || target.deletedAt != null) return;

      const nextSelectedIds = [
        ...new Set([...(selected.linkedNoteIds ?? []), targetId]),
      ].slice(0, 12);
      const nextTargetIds = [
        ...new Set([...(target.linkedNoteIds ?? []), selected.id]),
      ].slice(0, 12);

      const updatedSelected = persistNotePatch(selected, nextSelectedIds);
      const updatedTarget = persistNotePatch(target, nextTargetIds);
      if (!updatedSelected || !updatedTarget) return;

      setNotes((prev) =>
        prev.map((note) => {
          if (note.id === updatedSelected.id) return updatedSelected;
          if (note.id === updatedTarget.id) return updatedTarget;
          return note;
        }),
      );
      schedulePageSave(updatedSelected);
      schedulePageSave(updatedTarget);
    });
  };

  const onUnlinkNote = (targetId: string) => {
    if (!selected) return;
    setError(null);
    startTransition(() => {
      const target = notes.find((note) => note.id === targetId);
      const nextSelectedIds = (selected.linkedNoteIds ?? []).filter(
        (id) => id !== targetId,
      );
      const updatedSelected = persistNotePatch(selected, nextSelectedIds);
      if (!updatedSelected) return;

      let updatedTarget: Note | null = null;
      if (target) {
        updatedTarget = persistNotePatch(
          target,
          (target.linkedNoteIds ?? []).filter((id) => id !== selected.id),
        );
        if (!updatedTarget) return;
      }

      setNotes((prev) =>
        prev.map((note) => {
          if (note.id === updatedSelected.id) return updatedSelected;
          if (updatedTarget && note.id === updatedTarget.id) {
            return updatedTarget;
          }
          return note;
        }),
      );
      schedulePageSave(updatedSelected);
      if (updatedTarget) schedulePageSave(updatedTarget);
    });
  };

  const onAddEvent = (input: {
    title: string;
    day: string;
    tone: EventTone;
  }) => {
    setError(null);
    startTransition(() => {
      const result = runTagged(
        createCalendarEvent({
          workspaceId: activeWorkspaceId as WorkspaceId,
          title: input.title,
          day: input.day,
          noteId: selected?.id ?? null,
          tone: input.tone,
        }),
      );
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setEvents((prev) => [...prev, result.value]);
    });
  };

  const onDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== eventId));
  };

  const onOpenNote = (noteId: string) => {
    setSelectedId(noteId);
    setView("pages");
  };

  const selectNextAfterTrash = (
    remaining: readonly Note[],
    removedId: string,
  ) => {
    if (selectedId !== removedId) return;
    const next =
      remaining.find((note) => note.workspaceId === activeWorkspaceId) ??
      remaining[0];
    setSelectedId(next?.id ?? "");
  };

  const onTrashNote = (noteId: string) => {
    const existing = notes.find((note) => note.id === noteId);
    if (!existing || existing.deletedAt != null) return;
    if (
      (prefs?.confirmTrash ?? true) &&
      typeof window !== "undefined" &&
      !window.confirm(`Move “${existing.title || "Untitled"}” to trash?`)
    ) {
      return;
    }
    setError(null);
    startTransition(() => {
      void (async () => {
        const result = runTagged(softDeleteNote(existing));
        if (!result.ok) {
          setError(result.message);
          return;
        }
        if (ownerId) {
          const saved = await runTaggedPromise(
            persistPageUpdate(tablesDB, result.value),
          );
          if (!saved.ok) {
            setError(saved.message);
            return;
          }
        }
        setNotes((prev) =>
          prev.map((note) =>
            note.id === result.value.id ? result.value : note,
          ),
        );
        selectNextAfterTrash(
          notes
            .map((note) =>
              note.id === result.value.id ? result.value : note,
            )
            .filter((note) => note.deletedAt == null),
          noteId,
        );
      })();
    });
  };

  const onTrashFolder = (folderId: string) => {
    const existing = folders.find((folder) => folder.id === folderId);
    if (!existing || existing.deletedAt != null) return;
    if (
      (prefs?.confirmTrash ?? true) &&
      typeof window !== "undefined" &&
      !window.confirm(
        `Move folder “${existing.name}” and its pages to trash?`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(() => {
      void (async () => {
        const folderResult = runTagged(softDeleteFolder(existing));
        if (!folderResult.ok) {
          setError(folderResult.message);
          return;
        }

        const childNotes = notes.filter(
          (note) => note.folderId === folderId && note.deletedAt == null,
        );
        const trashedChildren: Note[] = [];
        for (const child of childNotes) {
          const soft = runTagged(softDeleteNote(child));
          if (!soft.ok) {
            setError(soft.message);
            return;
          }
          trashedChildren.push(soft.value);
        }

        if (ownerId) {
          const folderSaved = await runTaggedPromise(
            persistFolderDeletedAt(tablesDB, folderResult.value),
          );
          if (!folderSaved.ok) {
            setError(folderSaved.message);
            return;
          }
          for (const child of trashedChildren) {
            const saved = await runTaggedPromise(
              persistPageUpdate(tablesDB, child),
            );
            if (!saved.ok) {
              setError(saved.message);
              return;
            }
          }
        }

        setFolders((prev) =>
          prev.map((folder) =>
            folder.id === folderResult.value.id ? folderResult.value : folder,
          ),
        );
        const nextNotes = notes.map((note) => {
          const updated = trashedChildren.find(
            (child) => child.id === note.id,
          );
          return updated ?? note;
        });
        setNotes(nextNotes);
        if (
          selected &&
          (selected.folderId === folderId ||
            trashedChildren.some((child) => child.id === selected.id))
        ) {
          selectNextAfterTrash(
            nextNotes.filter((note) => note.deletedAt == null),
            selected.id,
          );
        }
      })();
    });
  };

  const onRestoreNote = (noteId: string) => {
    const existing = notes.find((note) => note.id === noteId);
    if (!existing || existing.deletedAt == null) return;
    setError(null);
    startTransition(() => {
      void (async () => {
        const result = runTagged(restoreNote(existing));
        if (!result.ok) {
          setError(result.message);
          return;
        }
        if (ownerId) {
          const saved = await runTaggedPromise(
            persistPageUpdate(tablesDB, result.value),
          );
          if (!saved.ok) {
            setError(saved.message);
            return;
          }
        }
        setNotes((prev) =>
          prev.map((note) =>
            note.id === result.value.id ? result.value : note,
          ),
        );
      })();
    });
  };

  const onRestoreFolder = (folderId: string) => {
    const existing = folders.find((folder) => folder.id === folderId);
    if (!existing || existing.deletedAt == null) return;
    setError(null);
    startTransition(() => {
      void (async () => {
        const folderResult = runTagged(restoreFolder(existing));
        if (!folderResult.ok) {
          setError(folderResult.message);
          return;
        }

        const childNotes = notes.filter(
          (note) => note.folderId === folderId && note.deletedAt != null,
        );
        const restoredChildren: Note[] = [];
        for (const child of childNotes) {
          const restored = runTagged(restoreNote(child));
          if (!restored.ok) {
            setError(restored.message);
            return;
          }
          restoredChildren.push(restored.value);
        }

        if (ownerId) {
          const folderSaved = await runTaggedPromise(
            persistFolderDeletedAt(tablesDB, folderResult.value),
          );
          if (!folderSaved.ok) {
            setError(folderSaved.message);
            return;
          }
          for (const child of restoredChildren) {
            const saved = await runTaggedPromise(
              persistPageUpdate(tablesDB, child),
            );
            if (!saved.ok) {
              setError(saved.message);
              return;
            }
          }
        }

        setFolders((prev) =>
          prev.map((folder) =>
            folder.id === folderResult.value.id ? folderResult.value : folder,
          ),
        );
        setNotes((prev) =>
          prev.map((note) => {
            const updated = restoredChildren.find(
              (child) => child.id === note.id,
            );
            return updated ?? note;
          }),
        );
        setExpandedFolderIds((prev) => new Set(prev).add(folderId));
      })();
    });
  };

  const onPermanentDeleteNote = (noteId: string) => {
    setError(null);
    startTransition(() => {
      void (async () => {
        if (ownerId) {
          const deleted = await runTaggedPromise(
            permanentlyDeletePage(tablesDB, noteId),
          );
          if (!deleted.ok) {
            setError(deleted.message);
            return;
          }
        }
        const nextNotes = notes.filter((note) => note.id !== noteId);
        setNotes(nextNotes);
        selectNextAfterTrash(
          nextNotes.filter((note) => note.deletedAt == null),
          noteId,
        );
      })();
    });
  };

  const onPermanentDeleteFolder = (folderId: string) => {
    setError(null);
    startTransition(() => {
      void (async () => {
        const childIds = notes
          .filter((note) => note.folderId === folderId)
          .map((note) => note.id);

        if (ownerId) {
          for (const childId of childIds) {
            const deleted = await runTaggedPromise(
              permanentlyDeletePage(tablesDB, childId),
            );
            if (!deleted.ok) {
              setError(deleted.message);
              return;
            }
          }
          const deleted = await runTaggedPromise(
            permanentlyDeleteFolder(tablesDB, folderId),
          );
          if (!deleted.ok) {
            setError(deleted.message);
            return;
          }
        }

        setFolders((prev) => prev.filter((folder) => folder.id !== folderId));
        const nextNotes = notes.filter((note) => note.folderId !== folderId);
        setNotes(nextNotes);
        if (selected && selected.folderId === folderId) {
          selectNextAfterTrash(
            nextNotes.filter((note) => note.deletedAt == null),
            selected.id,
          );
        }
      })();
    });
  };

  if (persist && (authLoading || hydrating)) {
    return (
      <VaultPreload
        label={
          authLoading ? "Checking your session…" : "Loading workspaces…"
        }
      />
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        data-vault-shell=""
        className="flex h-full min-h-0 w-full flex-1 flex-col items-stretch overflow-hidden bg-background text-foreground md:flex-row"
      >
        <VaultGlobalScrollToTop />
        <div className="mb-1 flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-sidebar px-2 py-2 md:hidden">
          <button
            type="button"
            onClick={() => onCreateNote({ title: "Untitled" })}
            className="shrink-0 rounded-[6px] bg-card px-2.5 py-1.5 text-[13px] shadow-sm"
          >
            + Page
          </button>
          <button
            type="button"
            onClick={() =>
              setView(view === "calendar" ? "pages" : "calendar")
            }
            className="shrink-0 rounded-[6px] px-2.5 py-1.5 text-[13px] text-muted-foreground hover:bg-muted"
          >
            {view === "calendar" ? "Pages" : "Calendar"}
          </button>
          {workspaceNotes.map((note, index) => (
            <button
              key={note.id}
              type="button"
              onClick={() => {
                setSelectedId(note.id);
                setView("pages");
              }}
              className={`shrink-0 rounded-[6px] px-2.5 py-1.5 text-[13px] ${
                note.id === selected?.id && view === "pages"
                  ? "bg-muted font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {noteMarks[index % noteMarks.length]} {note.title}
            </button>
          ))}
        </div>

        <VaultSidebar
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          folders={folders}
          notes={notes}
          selectedId={selected?.id}
          expandedFolderIds={expandedFolderIds}
          view={view}
          marks={noteMarks}
          onSelectWorkspace={onSelectWorkspace}
          onSelectNote={(id) => {
            setSelectedId(id);
            setView("pages");
          }}
          onToggleFolder={onToggleFolder}
          onExpandFolder={onExpandFolder}
          onCreateNote={onCreateNote}
          onCreateFolder={onCreateFolder}
          onCreateWorkspace={onCreateWorkspace}
          onTrashNote={onTrashNote}
          onTrashFolder={onTrashFolder}
            onChangeView={setView}
            creating={isPending}
            compact={prefs?.compactSidebar ?? false}
            width={prefs?.sidebarWidth ?? 252}
            showPageMarks={prefs?.showPageMarks ?? true}
            onWidthChange={(next) => {
              const sidebarWidth = clampSidebarWidth(next);
              setPrefs((prev) =>
                prev ? { ...prev, sidebarWidth } : prev,
              );
              patchVaultPreferences({ sidebarWidth });
            }}
          />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {view === "calendar" ? (
              <motion.div
                key="calendar"
                className="flex min-h-0 min-w-0 flex-1 overflow-hidden"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <VaultCalendar
                  events={workspaceEvents}
                  weekStartsOn={prefs?.weekStartsOn ?? "monday"}
                  onAddEvent={onAddEvent}
                  onDeleteEvent={onDeleteEvent}
                  onOpenNote={onOpenNote}
                />
              </motion.div>
            ) : view === "templates" ? (
              <motion.div
                key="templates"
                className="flex min-h-0 min-w-0 flex-1 overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <VaultTemplates
                  onUseTemplate={(templateId) => {
                    const template = getPageTemplate(templateId);
                    onCreateNote({
                      title: template.suggestedTitle,
                      templateId,
                    });
                  }}
                />
              </motion.div>
            ) : view === "settings" ? (
              <motion.div
                key="settings"
                className="flex min-h-0 min-w-0 flex-1 overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <VaultSettings
                  accountLabel={accountLabel}
                  onOpenTemplates={() => setView("templates")}
                />
              </motion.div>
            ) : view === "storage" ? (
              <motion.div
                key="storage"
                className="flex min-h-0 min-w-0 flex-1 overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <VaultStorage />
              </motion.div>
            ) : view === "lab" ? (
              <motion.div
                key="lab"
                className="flex min-h-0 min-w-0 flex-1 overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <VaultLab
                  events={workspaceEvents}
                  notes={notes.filter(
                    (note) => note.workspaceId === activeWorkspaceId,
                  )}
                  onOpenNote={onOpenNote}
                />
              </motion.div>
            ) : view === "trash" ? (
              <motion.div
                key="trash"
                className="flex min-h-0 min-w-0 flex-1 overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <VaultTrash
                  workspaces={workspaces}
                  folders={folders}
                  notes={notes}
                  busy={isPending}
                  onRestoreNote={onRestoreNote}
                  onRestoreFolder={onRestoreFolder}
                  onPermanentDeleteNote={onPermanentDeleteNote}
                  onPermanentDeleteFolder={onPermanentDeleteFolder}
                />
              </motion.div>
            ) : view === "map" ? (
              <motion.div
                key="map"
                className="flex min-h-0 min-w-0 flex-1 overflow-hidden"
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <VaultMap
                  workspaces={workspaces}
                  folders={folders}
                  notes={notes}
                  activeWorkspaceId={activeWorkspaceId}
                  onOpenNote={onOpenNote}
                />
              </motion.div>
            ) : (
              <motion.div
                key="pages"
                className="flex min-h-0 min-w-0 flex-1 overflow-hidden"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <VaultEditor
                  note={selected}
                  notes={notes}
                  mark={selectedMark}
                  error={error}
                  saving={isPending}
                  accountLabel={accountLabel}
                  fontSize={prefs?.editorFontSize ?? "md"}
                  density={prefs?.editorDensity ?? "comfortable"}
                  spellCheck={prefs?.spellCheck ?? true}
                  showLinkedNotes={prefs?.showLinkedNotes ?? true}
                  onChange={onChangeSelected}
                  onCreatePage={() => setCreateKind("page")}
                  onCreateFolder={() => setCreateKind("folder")}
                  onOpenNote={onOpenNote}
                  onLinkNote={onLinkNote}
                  onUnlinkNote={onUnlinkNote}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <VaultNameDialog
            open={createKind === "workspace"}
            onOpenChange={(open) => !open && setCreateKind(null)}
            title="Create workspace"
            description="Workspaces keep folders and pages separate — like Personal vs client work."
            placeholder="Personal, Acme, Research…"
            confirmLabel="Create workspace"
            onConfirm={(name) => {
              onCreateWorkspace(name);
              setCreateKind(null);
            }}
          />
          <VaultNameDialog
            open={createKind === "folder"}
            onOpenChange={(open) => !open && setCreateKind(null)}
            title="Create folder"
            description="Group related pages inside the active workspace."
            placeholder="Ideas, Projects, Archive…"
            confirmLabel="Create folder"
            onConfirm={(name) => {
              onCreateFolder(name);
              setCreateKind(null);
            }}
          />
          <VaultNameDialog
            open={createKind === "page"}
            onOpenChange={(open) => !open && setCreateKind(null)}
            title="Create page"
            description="Pick a template, then name the page."
            placeholder="Meeting notes, Brief, Inbox…"
            confirmLabel="Create page"
            defaultValue={prefs?.defaultNewPageTitle ?? "Untitled"}
            initialTemplateId={prefs?.defaultTemplateId ?? "blank"}
            templates
            onConfirm={(title, meta) => {
              onCreateNote({ title, templateId: meta?.templateId });
              setCreateKind(null);
            }}
          />
        </div>
      </div>
    </MotionConfig>
  );
}
