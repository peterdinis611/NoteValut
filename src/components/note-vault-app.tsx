"use client";

import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { PanelLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { VaultAccessProvider } from "@/context/vault-access";
import { toDailyKey } from "@/lib/daily";
import { easeQuick, pageVariants, sidebarSpring } from "@/lib/motion";
import { getTemplate } from "@/lib/templates";
import { downloadVaultMarkdown } from "@/lib/export-vault-md";
import { startVaultTour, hasSeenVaultTour } from "@/lib/onboarding";
import { downloadVaultBackup } from "@/lib/vault-backup";
import { useOwnerId } from "@/hooks/use-owner-id";
import { useVaultSettings } from "@/hooks/use-vault-settings";
import { CalendarPage } from "./calendar-page";
import { CommandIcons, CommandPalette, type CommandAction } from "./command-palette";
import { ConnectionStatus } from "./connection-status";
import { DueInbox } from "./due-inbox";
import { KeyboardCheatSheet } from "./keyboard-cheat-sheet";
import { GraphView } from "./graph-view";
import { LottieStatus } from "./lottie-status";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { NoteEditor } from "./note-editor";
import { QuickCapture, QuickCaptureFab } from "./quick-capture";
import { ReminderListener } from "./reminder-listener";
import { ScrollToTop } from "./scroll-to-top";
import { SettingsPage } from "./settings-page";
import { Sidebar } from "./sidebar";
import { SoftErrorBoundary } from "./soft-error-boundary";
import { TagsHub } from "./tags-hub";
import { useToast } from "./toast";
import { VaultHome } from "./vault-home";

type MainPanel = "home" | "note" | "settings" | "tags" | "calendar" | "due";

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
  const { isAuthenticated, isLoading: convexAuthLoading } = useConvexAuth();
  const toast = useToast();
  const isMobile = useIsMobile();
  useVaultSettings();
  const seedDemo = useMutation(api.notes.seedDemo);
  const createNote = useMutation(api.notes.create);
  const getOrCreateDaily = useMutation(api.notes.getOrCreateDaily);
  const canQuery = Boolean(ownerId && isAuthenticated);
  const notes = useQuery(
    api.notes.list,
    canQuery ? { ownerId: ownerId!, includeArchived: true } : "skip",
  );
  const exportData = useQuery(api.notes.exportVault, canQuery ? { ownerId: ownerId! } : "skip");
  const [activeId, setActiveId] = useState<Id<"notes"> | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDueInbox, setShowDueInbox] = useState(false);
  const [focusTag, setFocusTag] = useState<string | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [shareSignal, setShareSignal] = useState(0);
  const tourBooted = useRef(false);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  /** First-login Phosphor tour — once home + sidebar targets exist. */
  useEffect(() => {
    if (!canQuery || tourBooted.current || hasSeenVaultTour()) return;
    if (showSettings || showTags || showCalendar || showDueInbox || activeId) return;

    tourBooted.current = true;
    const boot = window.setTimeout(() => {
      setSidebarOpen(true);
      window.setTimeout(() => startVaultTour(), 450);
    }, 1100);
    return () => window.clearTimeout(boot);
  }, [canQuery, showSettings, showTags, showCalendar, showDueInbox, activeId]);

  useEffect(() => {
    if (!canQuery || seeded) return;
    void seedDemo({ ownerId: ownerId! })
      .then(() => setSeeded(true))
      .catch(() => {
        /* auth race — retry next mount */
      });
  }, [canQuery, ownerId, seeded, seedDemo]);

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
    setShowCalendar(false);
    setShowDueInbox(false);
    setFocusTag(null);
  }, []);

  const openTags = useCallback(
    (tag?: string | null) => {
      setActiveId(null);
      setShowSettings(false);
      setShowCalendar(false);
      setShowDueInbox(false);
      setFocusTag(tag ?? null);
      setShowTags(true);
      if (isMobile) setSidebarOpen(false);
    },
    [isMobile],
  );

  const openCalendar = useCallback(() => {
    setActiveId(null);
    setShowSettings(false);
    setShowTags(false);
    setShowDueInbox(false);
    setFocusTag(null);
    setShowCalendar(true);
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const openDueInbox = useCallback(() => {
    setActiveId(null);
    setShowSettings(false);
    setShowTags(false);
    setShowCalendar(false);
    setFocusTag(null);
    setShowDueInbox(true);
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

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
        toast.success(template.id === "blank" ? "Entry created" : `Created from ${template.name}`);
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

  const handleExportMarkdown = useCallback(() => {
    if (!exportData) {
      toast.error("Export isn’t ready yet");
      return;
    }
    downloadVaultMarkdown(exportData);
    toast.success("Downloaded vault Markdown");
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
        id: "calendar",
        label: "Open calendar",
        hint: "Month view & daily notes",
        icon: CommandIcons.calendar,
        keywords: ["daily", "month", "agenda"],
        run: () => openCalendar(),
      },
      {
        id: "due-inbox",
        label: "Due inbox",
        hint: "Overdue, today, upcoming todos",
        icon: CommandIcons.due,
        keywords: ["tasks", "todo", "deadline", "overdue"],
        run: () => openDueInbox(),
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
        keywords: ["tag", "filter", "#"],
        run: () => {
          openTags();
        },
      },
      {
        id: "share",
        label: "Share vault",
        hint: "Create or manage share links",
        icon: CommandIcons.share,
        keywords: ["invite", "link", "public", "collaborate"],
        run: () => {
          setSidebarOpen(true);
          setShareSignal((n) => n + 1);
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
          setShowCalendar(false);
          setShowDueInbox(false);
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
        id: "export-md",
        label: "Export vault Markdown",
        hint: "All pages as one .md",
        icon: CommandIcons.export,
        keywords: ["backup", "markdown", "md"],
        run: handleExportMarkdown,
      },
      {
        id: "tour",
        label: "Take a tour",
        hint: "Intro to NoteVault",
        icon: CommandIcons.home,
        keywords: ["onboarding", "help", "guide", "intro", "driver"],
        run: () => {
          clearPanels();
          setActiveId(null);
          setSidebarOpen(true);
          window.setTimeout(() => startVaultTour(), 350);
        },
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
    [
      clearPanels,
      handleCreateEntry,
      handleCreateCollection,
      handleExport,
      handleExportMarkdown,
      openToday,
      openTags,
      openCalendar,
      openDueInbox,
    ],
  );

  if (!ownerId || convexAuthLoading) {
    return (
      <LottieStatus
        compact
        variant="loading"
        title="Loading workspace…"
        description="Preparing your vault identity."
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <LottieStatus
        compact
        variant="error"
        title="Vault session not linked"
        description="Clerk is signed in, but Convex did not get a JWT. Create a Clerk JWT template named “convex” (aud: convex), then refresh or sign out and back in."
      />
    );
  }

  const panel: MainPanel = showSettings
    ? "settings"
    : showTags
      ? "tags"
      : showCalendar
        ? "calendar"
        : showDueInbox
          ? "due"
          : activeId
            ? "note"
            : "home";

  return (
    <VaultAccessProvider isOwner role="owner">
      <SoftErrorBoundary>
        {canQuery ? (
          <ReminderListener ownerId={ownerId} onOpenNote={(id) => selectNote(id as Id<"notes">)} />
        ) : null}
      </SoftErrorBoundary>
      <div
        className={`app-shell ${isMobile ? "app-shell-mobile" : ""} ${sidebarOpen ? "app-shell-sidebar-open" : ""}`}
      >
        <AnimatePresence initial={false}>
          {isMobile && sidebarOpen ? (
            <motion.button
              key="sidebar-backdrop"
              type="button"
              className="sidebar-backdrop"
              aria-label="Close sidebar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}
          {sidebarOpen ? (
            <Sidebar
              key="vault-sidebar"
              ownerId={ownerId}
              activeId={activeId}
              settingsActive={showSettings}
              tagsActive={showTags}
              calendarActive={showCalendar}
              dueActive={showDueInbox}
              mobile={isMobile}
              onSelect={selectNote}
              onGoHome={() => {
                clearPanels();
                setActiveId(null);
                if (isMobile) setSidebarOpen(false);
              }}
              onOpenSettings={() => {
                setActiveId(null);
                setShowTags(false);
                setShowCalendar(false);
                setShowDueInbox(false);
                setFocusTag(null);
                setShowSettings(true);
                if (isMobile) setSidebarOpen(false);
              }}
              onOpenTags={() => openTags()}
              onOpenCalendar={openCalendar}
              onOpenDueInbox={openDueInbox}
              onCollapse={() => setSidebarOpen(false)}
              onCreateEntry={handleCreateEntry}
              onCreateCollection={handleCreateCollection}
              onQuickCapture={() => setQuickCaptureOpen(true)}
              openShareSignal={shareSignal}
            />
          ) : null}
        </AnimatePresence>
        <main className={`app-main ${isMobile ? "app-main-mobile-nav" : ""}`}>
          {isMobile && (
            <div className="app-conn-bar">
              <ConnectionStatus />
            </div>
          )}
          <AnimatePresence>
            {!sidebarOpen ? (
              <motion.button
                key="sidebar-reopen"
                type="button"
                className="sidebar-reopen-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                initial={{ opacity: 0, x: -10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -8, scale: 0.92 }}
                transition={sidebarSpring}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
              >
                <PanelLeft className="size-4" />
              </motion.button>
            ) : null}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={panel === "note" ? String(activeId ?? "note") : panel}
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
                  onExportMarkdown={handleExportMarkdown}
                  onStartTour={() => {
                    clearPanels();
                    setActiveId(null);
                    setSidebarOpen(true);
                    window.setTimeout(() => startVaultTour(), 400);
                  }}
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
              ) : panel === "due" ? (
                <DueInbox
                  ownerId={ownerId}
                  onClose={() => setShowDueInbox(false)}
                  onNavigate={selectNote}
                />
              ) : panel === "calendar" ? (
                <SoftErrorBoundary
                  fallback={
                    <LottieStatus
                      compact
                      variant="error"
                      title="Calendar unavailable"
                      description="Reminders aren’t synced yet. Run convex deploy / npx convex dev, then try again."
                      actions={[
                        {
                          label: "Back to vault",
                          onClick: () => setShowCalendar(false),
                          primary: true,
                        },
                      ]}
                    />
                  }
                >
                  <CalendarPage
                    ownerId={ownerId}
                    onClose={() => setShowCalendar(false)}
                    onNavigate={selectNote}
                  />
                </SoftErrorBoundary>
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
                  onOpenCalendar={openCalendar}
                  onOpenDueInbox={openDueInbox}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <ScrollToTop resetKey={panel === "note" ? activeId : panel} />
          {!isMobile && <QuickCaptureFab onClick={() => setQuickCaptureOpen(true)} />}
          {isMobile && (
            <MobileBottomNav
              active={
                cmdOpen
                  ? "search"
                  : showDueInbox
                    ? "due"
                    : sidebarOpen
                      ? "menu"
                      : panel === "home"
                        ? "home"
                        : "home"
              }
              onHome={() => {
                clearPanels();
                setActiveId(null);
                setSidebarOpen(false);
              }}
              onSearch={() => setCmdOpen(true)}
              onCapture={() => setQuickCaptureOpen(true)}
              onDue={() => openDueInbox()}
              onMenu={() => setSidebarOpen((v) => !v)}
            />
          )}
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
            onOpenTag={(tag) => openTags(tag)}
            ownerId={ownerId}
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
