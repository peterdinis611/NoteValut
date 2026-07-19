"use client";

import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { PanelLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { VaultAccessProvider } from "@/context/vault-access";
import { toDailyKey } from "@/lib/daily";
import { easeOutSoft, easeQuick, pageVariants } from "@/lib/motion";
import { getTemplate } from "@/lib/templates";
import { downloadVaultBackup } from "@/lib/vault-backup";
import { useOwnerId } from "@/hooks/use-owner-id";
import { useVaultSettings } from "@/hooks/use-vault-settings";
import { CommandIcons, CommandPalette, type CommandAction } from "./command-palette";
import { KeyboardCheatSheet } from "./keyboard-cheat-sheet";
import { GraphView } from "./graph-view";
import { LottieStatus } from "./lottie-status";
import { NoteEditor } from "./note-editor";
import { QuickCapture, QuickCaptureFab } from "./quick-capture";
import { ScrollToTop } from "./scroll-to-top";
import { SettingsPage } from "./settings-page";
import { Sidebar } from "./sidebar";
import { TagsHub } from "./tags-hub";
import { useToast } from "./toast";
import { VaultHome } from "./vault-home";

type MainPanel = "home" | "note" | "settings" | "tags";

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [breakpoint]);
  return mobile;
}

export function NoteVaultApp() {
  const ownerId = useOwnerId();
  const toast = useToast();
  const isMobile = useIsMobile();
  useVaultSettings();
  const seedDemo = useMutation(api.notes.seedDemo);
  const createNote = useMutation(api.notes.create);
  const getOrCreateDaily = useMutation(api.notes.getOrCreateDaily);
  const notes = useQuery(
    api.notes.list,
    ownerId ? { ownerId, includeArchived: true } : "skip",
  );
  const exportData = useQuery(api.notes.exportVault, ownerId ? { ownerId } : "skip");
  const [activeId, setActiveId] = useState<Id<"notes"> | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [focusTag, setFocusTag] = useState<string | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (!ownerId || seeded) return;
    seedDemo({ ownerId }).then(() => setSeeded(true));
  }, [ownerId, seeded, seedDemo]);

  useEffect(() => {
    if (!activeId || !notes) return;
    if (!notes.some((n) => n._id === activeId && !n.trashed)) {
      setActiveId(null);
    }
  }, [notes, activeId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShortcutsOpen(false);
        setCmdOpen((v) => !v);
      }
      if (meta && e.key === "/") {
        e.preventDefault();
        setCmdOpen(false);
        setShortcutsOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const clearPanels = useCallback(() => {
    setShowSettings(false);
    setShowTags(false);
    setFocusTag(null);
  }, []);

  const openTags = useCallback(
    (tag?: string | null) => {
      setActiveId(null);
      setShowSettings(false);
      setFocusTag(tag ?? null);
      setShowTags(true);
      if (isMobile) setSidebarOpen(false);
    },
    [isMobile],
  );

  const selectNote = useCallback(
    (id: Id<"notes"> | null) => {
      clearPanels();
      setActiveId(id);
      if (isMobile) setSidebarOpen(false);
    },
    [clearPanels, isMobile],
  );

  const openToday = useCallback(async () => {
    if (!ownerId) return;
    try {
      const id = await getOrCreateDaily({ ownerId, dailyKey: toDailyKey() });
      selectNote(id);
    } catch {
      toast.error("Couldn’t open today’s note");
    }
  }, [ownerId, getOrCreateDaily, selectNote, toast]);

  const handleCreateEntry = useCallback(
    async (parentId?: Id<"notes">, templateId = "blank") => {
      if (!ownerId) return;
      try {
        const template = getTemplate(templateId);
        const id = await createNote({
          ownerId,
          parentId,
          kind: "page",
          title: template.id === "blank" ? "Untitled" : template.name,
          icon: template.icon,
          tags: template.tags,
          blocks: template.blocks.map((b) => ({
            ...b,
            id: crypto.randomUUID(),
            rows: b.rows?.map((row) => [...row]),
          })),
        });
        clearPanels();
        setActiveId(id);
        if (isMobile) setSidebarOpen(false);
        toast.success(
          template.id === "blank" ? "Entry created" : `Created from ${template.name}`,
        );
      } catch {
        toast.error("Couldn’t create entry");
      }
    },
    [ownerId, createNote, toast, clearPanels, isMobile],
  );

  const handleCreateCollection = useCallback(
    async (parentId?: Id<"notes">) => {
      if (!ownerId) return;
      try {
        const id = await createNote({
          ownerId,
          parentId,
          kind: "folder",
          title: "New collection",
          icon: "🗂️",
          color: "teal",
        });
        clearPanels();
        setActiveId(id);
        if (isMobile) setSidebarOpen(false);
        toast.success("Collection created");
      } catch {
        toast.error("Couldn’t create collection");
      }
    },
    [ownerId, createNote, toast, clearPanels, isMobile],
  );

  const handleExport = useCallback(() => {
    if (!exportData) {
      toast.error("Export isn’t ready yet");
      return;
    }
    downloadVaultBackup(exportData);
    toast.success(`Exported ${exportData.notes.length} items`);
  }, [exportData, toast]);

  const cmdActions: CommandAction[] = useMemo(
    () => [
      {
        id: "home",
        label: "Go home",
        hint: "Vault overview",
        icon: CommandIcons.home,
        keywords: ["vault", "home"],
        run: () => {
          clearPanels();
          setActiveId(null);
        },
      },
      {
        id: "new-page",
        label: "New page",
        hint: "Blank entry",
        icon: CommandIcons.page,
        keywords: ["create", "entry"],
        run: () => void handleCreateEntry(undefined, "blank"),
      },
      {
        id: "new-collection",
        label: "New collection",
        icon: CommandIcons.collection,
        keywords: ["folder"],
        run: () => void handleCreateCollection(),
      },
      {
        id: "today",
        label: "Today’s note",
        hint: "Open or create daily note",
        icon: CommandIcons.today,
        keywords: ["daily", "calendar", "today"],
        run: () => void openToday(),
      },
      {
        id: "quick-capture",
        label: "Quick capture",
        icon: CommandIcons.capture,
        keywords: ["inbox"],
        run: () => setQuickCaptureOpen(true),
      },
      {
        id: "tags",
        label: "Browse tags",
        icon: CommandIcons.tags,
        keywords: ["tag", "filter"],
        run: () => {
          openTags();
        },
      },
      {
        id: "settings",
        label: "Open settings",
        icon: CommandIcons.settings,
        keywords: ["theme", "font"],
        run: () => {
          setActiveId(null);
          setShowTags(false);
          setFocusTag(null);
          setShowSettings(true);
        },
      },
      {
        id: "export",
        label: "Export vault JSON",
        hint: "Download backup",
        icon: CommandIcons.export,
        keywords: ["backup", "download"],
        run: handleExport,
      },
      {
        id: "shortcuts",
        label: "Keyboard shortcuts",
        hint: "⌘ /",
        icon: CommandIcons.keyboard,
        keywords: ["hotkeys", "cheatsheet", "help"],
        run: () => setShortcutsOpen(true),
      },
      {
        id: "graph",
        label: "Page graph",
        hint: "See linked pages",
        icon: CommandIcons.network,
        keywords: ["graph", "links", "backlinks", "network"],
        run: () => setGraphOpen(true),
      },
    ],
    [clearPanels, handleCreateEntry, handleCreateCollection, handleExport, openToday, openTags],
  );

  if (!ownerId) {
    return (
      <LottieStatus
        compact
        variant="loading"
        title="Loading workspace…"
        description="Preparing your local vault identity."
      />
    );
  }

  const panel: MainPanel = showSettings
    ? "settings"
    : showTags
      ? "tags"
      : activeId
        ? "note"
        : "home";

  return (
    <VaultAccessProvider isOwner role="owner">
      <div className={`app-shell ${isMobile ? "app-shell-mobile" : ""} ${sidebarOpen ? "app-shell-sidebar-open" : ""}`}>
        <AnimatePresence initial={false}>
          {isMobile && sidebarOpen && (
            <motion.button
              type="button"
              className="sidebar-backdrop"
              aria-label="Close sidebar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={easeQuick}
              onClick={() => setSidebarOpen(false)}
            />
          )}
          {sidebarOpen && (
            <Sidebar
              ownerId={ownerId}
              activeId={activeId}
              settingsActive={showSettings}
              tagsActive={showTags}
              onSelect={selectNote}
              onGoHome={() => {
                clearPanels();
                setActiveId(null);
                if (isMobile) setSidebarOpen(false);
              }}
              onOpenSettings={() => {
                setActiveId(null);
                setShowTags(false);
                setFocusTag(null);
                setShowSettings(true);
                if (isMobile) setSidebarOpen(false);
              }}
              onOpenTags={() => openTags()}
              onCollapse={() => setSidebarOpen(false)}
              onCreateEntry={handleCreateEntry}
              onCreateCollection={handleCreateCollection}
              onQuickCapture={() => setQuickCaptureOpen(true)}
            />
          )}
        </AnimatePresence>
        <main className="app-main">
          <AnimatePresence>
            {!sidebarOpen && (
              <motion.button
                type="button"
                className="sidebar-reopen-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={easeOutSoft}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PanelLeft className="size-4" />
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={panel === "note" ? activeId : panel}
              className="app-main-view"
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={easeQuick}
            >
              {panel === "settings" ? (
                <SettingsPage
                  ownerId={ownerId}
                  onClose={() => setShowSettings(false)}
                  onExport={handleExport}
                />
              ) : panel === "tags" ? (
                <TagsHub
                  ownerId={ownerId}
                  initialTag={focusTag}
                  onClose={() => {
                    setShowTags(false);
                    setFocusTag(null);
                  }}
                  onNavigate={selectNote}
                />
              ) : panel === "note" && activeId ? (
                <NoteEditor
                  noteId={activeId}
                  ownerId={ownerId}
                  onNavigate={selectNote}
                  onToggleSidebar={() => setSidebarOpen(true)}
                  sidebarCollapsed={!sidebarOpen || isMobile}
                  onCreateEntry={handleCreateEntry}
                  onCreateCollection={handleCreateCollection}
                  onOpenTag={(tag) => openTags(tag)}
                />
              ) : (
                <VaultHome
                  ownerId={ownerId}
                  onNavigate={selectNote}
                  onCreateEntry={(templateId) => handleCreateEntry(undefined, templateId)}
                  onCreateCollection={() => handleCreateCollection()}
                  onQuickCapture={() => setQuickCaptureOpen(true)}
                  onOpenGraph={() => setGraphOpen(true)}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <ScrollToTop resetKey={panel === "note" ? activeId : panel} />
          <QuickCaptureFab onClick={() => setQuickCaptureOpen(true)} />
          <QuickCapture
            ownerId={ownerId}
            open={quickCaptureOpen}
            onClose={() => setQuickCaptureOpen(false)}
            onCreated={selectNote}
          />
          <CommandPalette
            open={cmdOpen}
            onClose={() => setCmdOpen(false)}
            notes={notes?.filter((n) => !n.archived && !n.trashed)}
            actions={cmdActions}
            onNavigate={selectNote}
          />
          <KeyboardCheatSheet open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
          <GraphView
            open={graphOpen}
            onClose={() => setGraphOpen(false)}
            notes={notes}
            onNavigate={selectNote}
          />
        </main>
      </div>
    </VaultAccessProvider>
  );
}
