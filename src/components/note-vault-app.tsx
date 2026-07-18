"use client";

import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { PanelLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { VaultAccessProvider } from "@/context/vault-access";
import { easeOutSoft, easeQuick, pageVariants } from "@/lib/motion";
import { getTemplate } from "@/lib/templates";
import { useOwnerId } from "@/hooks/use-owner-id";
import { useVaultSettings } from "@/hooks/use-vault-settings";
import { LottieStatus } from "./lottie-status";
import { NoteEditor } from "./note-editor";
import { QuickCapture, QuickCaptureFab } from "./quick-capture";
import { SettingsPage } from "./settings-page";
import { Sidebar } from "./sidebar";
import { useToast } from "./toast";
import { VaultHome } from "./vault-home";

export function NoteVaultApp() {
  const ownerId = useOwnerId();
  const toast = useToast();
  useVaultSettings();
  const seedDemo = useMutation(api.notes.seedDemo);
  const createNote = useMutation(api.notes.create);
  const notes = useQuery(api.notes.list, ownerId ? { ownerId } : "skip");
  const [activeId, setActiveId] = useState<Id<"notes"> | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!ownerId || seeded) return;
    seedDemo({ ownerId }).then(() => setSeeded(true));
  }, [ownerId, seeded, seedDemo]);

  useEffect(() => {
    if (!activeId || !notes) return;
    if (!notes.some((n) => n._id === activeId)) {
      setActiveId(null);
    }
  }, [notes, activeId]);

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
        setActiveId(id);
        toast.success(
          template.id === "blank" ? "Entry created" : `Created from ${template.name}`,
        );
      } catch {
        toast.error("Couldn’t create entry");
      }
    },
    [ownerId, createNote, toast],
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
        setActiveId(id);
        toast.success("Collection created");
      } catch {
        toast.error("Couldn’t create collection");
      }
    },
    [ownerId, createNote, toast],
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

  return (
    <VaultAccessProvider value={{ readOnly: false, isOwner: true }}>
      <div className="app-shell">
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <Sidebar
              ownerId={ownerId}
              activeId={activeId}
              settingsActive={showSettings}
              onSelect={(id) => {
                setShowSettings(false);
                setActiveId(id);
              }}
              onGoHome={() => {
                setShowSettings(false);
                setActiveId(null);
              }}
              onOpenSettings={() => {
                setActiveId(null);
                setShowSettings(true);
              }}
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
              key={showSettings ? "settings" : (activeId ?? "home")}
              className="app-main-view"
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={easeQuick}
            >
              {showSettings ? (
                <SettingsPage onClose={() => setShowSettings(false)} />
              ) : activeId ? (
                <NoteEditor
                  noteId={activeId}
                  ownerId={ownerId}
                  onNavigate={(id) => {
                    setShowSettings(false);
                    setActiveId(id);
                  }}
                  onToggleSidebar={() => setSidebarOpen(true)}
                  sidebarCollapsed={!sidebarOpen}
                  onCreateEntry={handleCreateEntry}
                  onCreateCollection={handleCreateCollection}
                />
              ) : (
                <VaultHome
                  ownerId={ownerId}
                  onNavigate={(id) => {
                    setShowSettings(false);
                    setActiveId(id);
                  }}
                  onCreateEntry={(templateId) => handleCreateEntry(undefined, templateId)}
                  onCreateCollection={() => handleCreateCollection()}
                  onQuickCapture={() => setQuickCaptureOpen(true)}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <QuickCaptureFab onClick={() => setQuickCaptureOpen(true)} />
          <QuickCapture
            ownerId={ownerId}
            open={quickCaptureOpen}
            onClose={() => setQuickCaptureOpen(false)}
            onCreated={setActiveId}
          />
        </main>
      </div>
    </VaultAccessProvider>
  );
}
