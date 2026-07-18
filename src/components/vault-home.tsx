"use client";

import { useQuery } from "convex/react";
import { ArrowRight, FolderOpen, Plus, Share2, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { countOpenTasks } from "@/lib/blocks";
import { useCustomTemplates } from "@/hooks/use-custom-templates";
import { formatRelativeTime } from "@/lib/format";
import { isFolder } from "@/lib/item-kinds";
import {
  easeOutSoft,
  fadeUpVariants,
  staggerContainer,
  staggerItem,
} from "@/lib/motion";
import { PAGE_TEMPLATES } from "@/lib/templates";
import { DailyCalendar } from "./daily-calendar";
import { SharePanel } from "./share-panel";

type Props = {
  ownerId: string;
  onNavigate: (id: Id<"notes">) => void;
  onCreateEntry: (templateId?: string) => void;
  onCreateCollection: () => void;
  onQuickCapture: () => void;
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
}: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const customTemplates = useCustomTemplates();
  const templates = useMemo(
    () => [...customTemplates, ...PAGE_TEMPLATES.filter((t) => t.id !== "blank")],
    [customTemplates],
  );
  const stats = useQuery(api.notes.getVaultStats, { ownerId });
  const notes = useQuery(api.notes.list, { ownerId });

  const recent =
    notes
      ?.filter((n) => !isFolder(n))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 8) ?? [];

  const openTaskEntries =
    notes
      ?.filter((n) => !isFolder(n) && countOpenTasks(n.blocks) > 0)
      .slice(0, 5) ?? [];

  return (
    <motion.div
      className="vault-home note-scroll"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="vault-home-glow" aria-hidden />

      <motion.header className="vault-home-hero" variants={fadeUpVariants} transition={easeOutSoft}>
        <p className="vault-home-kicker">Your knowledge vault</p>
        <h1 className="vault-home-title">NoteVault</h1>
        <p className="vault-home-subtitle">
          Capture ideas and organize them into collections — your workspace, your structure.
        </p>

        <div className="vault-home-actions">
          <motion.button
            type="button"
            className="vault-btn-primary"
            onClick={() => onCreateEntry()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="size-4" />
            New entry
          </motion.button>
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
        </div>

        {stats && (
          <p className="vault-home-meta">
            {plural(stats.entries, "entry", "entries")}
            <span className="vault-meta-dot" />
            {plural(stats.collections, "collection", "collections")}
            <span className="vault-meta-dot" />
            {plural(stats.openTasks, "open task", "open tasks")}
          </p>
        )}
      </motion.header>

      <motion.div variants={fadeUpVariants} transition={easeOutSoft}>
        <DailyCalendar ownerId={ownerId} onOpenNote={onNavigate} />
      </motion.div>

      <div className="vault-home-body">
        <motion.section className="vault-section" variants={fadeUpVariants} transition={easeOutSoft}>
          <div className="vault-section-head">
            <h2 className="vault-section-title">Continue</h2>
          </div>
          {recent.length === 0 ? (
            <p className="vault-empty">No entries yet — start with a blank page or a template.</p>
          ) : (
            <motion.ul className="vault-row-list" variants={staggerContainer}>
              {recent.map((entry) => {
                const tasks = countOpenTasks(entry.blocks);
                return (
                  <motion.li key={entry._id} variants={staggerItem}>
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
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </motion.section>

        {openTaskEntries.length > 0 && (
          <motion.section className="vault-section" variants={fadeUpVariants} transition={easeOutSoft}>
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
          </motion.section>
        )}

        <motion.section className="vault-section" variants={fadeUpVariants} transition={easeOutSoft}>
          <div className="vault-section-head">
            <h2 className="vault-section-title">Start from</h2>
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
        </motion.section>
      </div>

      <SharePanel
        ownerId={ownerId}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        scope="vault"
        title="NoteVault"
      />
    </motion.div>
  );
}
