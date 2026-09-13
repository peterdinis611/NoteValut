"use client";

import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  CalendarClock,
  Flame,
  FolderOpen,
  ImageIcon,
  LayoutTemplate,
  Loader2,
  Network,
  Plus,
  Share2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { countOpenTasks, countOverdueTasks } from "@/lib/blocks";
import { collectDueTasks } from "@/lib/due-tasks";
import { useCustomTemplates } from "@/hooks/use-custom-templates";
import { useVaultUpload } from "@/hooks/use-vault-upload";
import { formatRelativeTime } from "@/lib/format";
import { isFolder } from "@/lib/item-kinds";
import { playFolioPageMotion } from "@/lib/folio-page-motion";
import { PAGE_TEMPLATES } from "@/lib/templates";
import { DailyCalendar } from "./daily-calendar";
import { FocusModeToggle } from "./focus-mode-toggle";
import { SharePanel } from "./share-panel";
import { useToast } from "./toast";

type Props = {
  ownerId: string;
  onNavigate: (id: Id<"notes">) => void;
  onCreateEntry: (templateId?: string) => void;
  onCreateCollection: () => void;
  onQuickCapture: () => void;
  onOpenGraph?: () => void;
  onOpenCalendar?: () => void;
  onOpenDueInbox?: () => void;
  onBrowseTemplates?: () => void;
};

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export function VaultHome({
  ownerId,
  onNavigate,
  onCreateEntry,
  onCreateCollection,
  onQuickCapture,
  onOpenGraph,
  onOpenCalendar,
  onOpenDueInbox,
  onBrowseTemplates,
}: Props) {
  const toast = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const { uploadFile } = useVaultUpload();
  const updateSettings = useMutation(api.vaultSettings.update);
  const getOrCreateDaily = useMutation(api.notes.getOrCreateDaily);
  const customTemplates = useCustomTemplates();
  const templates = useMemo(
    () => [...customTemplates, ...PAGE_TEMPLATES.filter((t) => t.id !== "blank")],
    [customTemplates],
  );
  const stats = useQuery(api.notes.getVaultStats, ownerId ? { ownerId } : "skip");
  const streak = useQuery(api.vaultStats.get, ownerId ? { ownerId } : "skip");
  const notes = useQuery(api.notes.list, ownerId ? { ownerId } : "skip");
  const vaultSettings = useQuery(api.vaultSettings.get, ownerId ? { ownerId } : "skip");
  const backgroundImage = vaultSettings?.backgroundImage;
  const autoDailyDone = useRef(false);

  useEffect(() => {
    if (!vaultSettings?.autoDailyNote || autoDailyDone.current) return;
    autoDailyDone.current = true;
    const dailyKey = new Date().toISOString().slice(0, 10);
    void getOrCreateDaily({ ownerId, dailyKey }).catch(() => {
      autoDailyDone.current = false;
    });
  }, [vaultSettings?.autoDailyNote, ownerId, getOrCreateDaily]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return playFolioPageMotion(root);
  }, []);

  async function uploadBackground(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    setBgUploading(true);
    try {
      const uploaded = await uploadFile(file);
      await updateSettings({ ownerId, backgroundImage: uploaded.url });
      toast.success("Vault background saved");
    } catch {
      toast.error("Couldn’t upload background");
    } finally {
      setBgUploading(false);
      if (bgFileRef.current) bgFileRef.current.value = "";
    }
  }

  async function clearBackground() {
    try {
      await updateSettings({ ownerId, backgroundImage: null });
      toast.success("Background removed");
    } catch {
      toast.error("Couldn’t remove background");
    }
  }

  const recent =
    notes
      ?.filter((n) => !isFolder(n))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 8) ?? [];

  const openTaskEntries =
    notes?.filter((n) => !isFolder(n) && countOpenTasks(n.blocks) > 0).slice(0, 5) ?? [];

  const dueTasks = useMemo(
    () => collectDueTasks(notes, Date.now(), { includeLater: false }).slice(0, 8),
    [notes],
  );
  const overdueCount = useMemo(
    () => notes?.reduce((sum, n) => sum + (isFolder(n) ? 0 : countOverdueTasks(n.blocks)), 0) ?? 0,
    [notes],
  );

  return (
    <div
      ref={rootRef}
      className={`vault-home note-scroll ${backgroundImage ? "vault-home-has-bg" : ""}`}
      style={
        backgroundImage
          ? ({ "--vault-bg-image": `url(${backgroundImage})` } as React.CSSProperties)
          : undefined
      }
    >
      <div className="vault-home-glow" aria-hidden />
      {backgroundImage && <div className="vault-home-bg" aria-hidden />}

      <header className="vault-home-hero nv-folio-await">
        <div className="vault-home-bg-actions">
          <input
            ref={bgFileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => void uploadBackground(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className="vault-bg-btn"
            disabled={bgUploading}
            onClick={() => bgFileRef.current?.click()}
            title="Upload vault background"
          >
            {bgUploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : backgroundImage ? (
              <ImageIcon className="size-3.5" />
            ) : (
              <Upload className="size-3.5" />
            )}
            {bgUploading
              ? "Uploading…"
              : backgroundImage
                ? "Change background"
                : "Vault background"}
          </button>
          {backgroundImage && (
            <button
              type="button"
              className="vault-bg-btn"
              onClick={() => void clearBackground()}
              title="Remove background"
            >
              <X className="size-3.5" />
              Remove
            </button>
          )}
        </div>
        <p className="vault-home-kicker" data-tour="vault-home">
          Today’s desk
        </p>
        <h1 className="vault-home-title">
          Your Daily <em>Pages</em>
        </h1>
        <p className="vault-home-subtitle">
          Handwritten thinking, made from pages you actually keep — not another dump of tabs.
        </p>

        <div className="vault-home-actions">
          <button
            type="button"
            className="vault-btn-primary"
            data-tour="new-entry"
            onClick={() => onCreateEntry()}
          >
            <Plus className="size-4" />
            New entry
          </button>
          <button type="button" className="vault-link-btn" onClick={onCreateCollection}>
            <FolderOpen className="size-3.5" />
            Collection
          </button>
          <button type="button" className="vault-link-btn" onClick={onQuickCapture}>
            <Zap className="size-3.5" />
            Capture
          </button>
          <button type="button" className="vault-link-btn" onClick={() => setShareOpen(true)}>
            <Share2 className="size-3.5" />
            Share
          </button>
          {onOpenGraph && (
            <button type="button" className="vault-link-btn" onClick={onOpenGraph}>
              <Network className="size-3.5" />
              Graph
            </button>
          )}
        </div>

        {stats && (
          <p className="vault-home-meta">
            {plural(stats.entries, "entry", "entries")}
            <span className="vault-meta-dot" />
            {plural(stats.collections, "collection", "collections")}
            <span className="vault-meta-dot" />
            {plural(stats.openTasks, "open task", "open tasks")}
            {overdueCount > 0 && (
              <>
                <span className="vault-meta-dot" />
                <span className="vault-meta-overdue">
                  {plural(overdueCount, "overdue", "overdue")}
                </span>
              </>
            )}
          </p>
        )}
      </header>

      <div className="nv-folio-await">
        <div className="vault-calendar-block" data-tour="daily-notes">
          <DailyCalendar ownerId={ownerId} onOpenNote={onNavigate} />
          {onOpenCalendar && (
            <button type="button" className="vault-calendar-open" onClick={onOpenCalendar}>
              <CalendarClock className="size-3.5" />
              Open calendar
              <ArrowRight className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="vault-home-body">
        <section className="vault-section vault-widgets nv-folio-await">
          <div className="vault-widget-row">
            <div className="vault-widget vault-widget-streak">
              <Flame className="size-4 text-accent" />
              <div>
                <p className="vault-widget-label">Writing streak</p>
                <p className="vault-widget-value">
                  {streak?.currentStreak ?? 0}
                  <span className="vault-widget-unit">
                    {(streak?.currentStreak ?? 0) === 1 ? " day" : " days"}
                  </span>
                </p>
                {(streak?.longestStreak ?? 0) > 0 && (
                  <p className="vault-widget-hint">
                    Best {streak!.longestStreak} · keep showing up
                  </p>
                )}
              </div>
            </div>
            <div className="vault-widget vault-widget-focus">
              <FocusModeToggle className="vault-focus-cta" label="Focus mode" />
              <p className="vault-widget-hint">Hide chrome — write only</p>
            </div>
          </div>
        </section>

        <section className="vault-section nv-folio-await">
          <div className="vault-section-head">
            <h2 className="vault-section-title">Continue</h2>
          </div>
          {recent.length === 0 ? (
            <p className="vault-empty">No entries yet — start with a blank page or a template.</p>
          ) : (
            <ul className="vault-row-list">
              {recent.map((entry) => {
                const tasks = countOpenTasks(entry.blocks);
                return (
                  <li key={entry._id}>
                    <button
                      type="button"
                      className="vault-row"
                      onClick={() => onNavigate(entry._id)}
                    >
                      <span className="vault-row-icon">{entry.icon}</span>
                      <span className="vault-row-main">
                        <span className="vault-row-title">{entry.title || "Untitled"}</span>
                        {tasks > 0 && (
                          <span className="vault-row-hint">
                            {plural(tasks, "open task", "open tasks")}
                          </span>
                        )}
                      </span>
                      <span className="vault-row-meta">{formatRelativeTime(entry.updatedAt)}</span>
                      <ArrowRight className="vault-row-arrow size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {dueTasks.length > 0 && (
          <section className="vault-section nv-folio-await">
            <div className="vault-section-head">
              <h2 className="vault-section-title">
                <CalendarClock className="inline size-4 mr-1.5 opacity-70" />
                Due soon
              </h2>
              {onOpenDueInbox && (
                <button type="button" className="vault-section-link" onClick={onOpenDueInbox}>
                  Open inbox
                  <ArrowRight className="size-3.5" />
                </button>
              )}
            </div>
            <ul className="vault-row-list">
              {dueTasks.map((task) => (
                <li key={`${task.noteId}-${task.dueAt}-${task.text}`}>
                  <button
                    type="button"
                    className="vault-row"
                    onClick={() => onNavigate(task.noteId)}
                  >
                    <span className="vault-row-icon">{task.noteIcon}</span>
                    <span className="vault-row-main">
                      <span className="vault-row-title">{task.text}</span>
                      <span className="vault-row-hint">{task.noteTitle}</span>
                    </span>
                    <span
                      className={`vault-row-badge ${task.overdue ? "vault-row-badge-overdue" : ""}`}
                    >
                      {task.overdue
                        ? "Overdue"
                        : new Date(task.dueAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {openTaskEntries.length > 0 && (
          <section className="vault-section nv-folio-await">
            <div className="vault-section-head">
              <h2 className="vault-section-title">Needs attention</h2>
            </div>
            <ul className="vault-row-list">
              {openTaskEntries.map((entry) => {
                const n = countOpenTasks(entry.blocks);
                return (
                  <li key={entry._id}>
                    <button
                      type="button"
                      className="vault-row"
                      onClick={() => onNavigate(entry._id)}
                    >
                      <span className="vault-row-icon">{entry.icon}</span>
                      <span className="vault-row-main">
                        <span className="vault-row-title">{entry.title || "Untitled"}</span>
                      </span>
                      <span className="vault-row-badge">{plural(n, "task", "tasks")}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="vault-section nv-folio-await">
          <div className="vault-section-head">
            <h2 className="vault-section-title">Start from</h2>
            {onBrowseTemplates && (
              <button type="button" className="vault-section-link" onClick={onBrowseTemplates}>
                <LayoutTemplate className="size-3.5" />
                Browse templates
                <ArrowRight className="size-3.5" />
              </button>
            )}
          </div>
          <div className="vault-template-row">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                className="vault-template-chip"
                onClick={() => onCreateEntry(template.id)}
              >
                <span>{template.icon}</span>
                <span>{template.name}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <SharePanel
        ownerId={ownerId}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        scope="vault"
        title="NoteVault"
      />
    </div>
  );
}
