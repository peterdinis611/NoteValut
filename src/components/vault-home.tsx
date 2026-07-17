"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowRight, CheckSquare, FileText, FolderOpen, Plus, Share2, Sparkles, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { countOpenTasks } from "@/lib/blocks";
import { formatRelativeTime } from "@/lib/format";
import { isFolder } from "@/lib/item-kinds";
import {
  easeOutSoft,
  fadeUpVariants,
  staggerContainer,
  staggerItem,
} from "@/lib/motion";
import { PAGE_TEMPLATES } from "@/lib/templates";
import { SharePanel } from "./share-panel";

type Props = {
  ownerId: string;
  onNavigate: (id: Id<"notes">) => void;
  onCreateEntry: (templateId?: string) => void;
  onCreateCollection: () => void;
  onQuickCapture: () => void;
};

export function VaultHome({
  ownerId,
  onNavigate,
  onCreateEntry,
  onCreateCollection,
  onQuickCapture,
}: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const stats = useQuery(api.notes.getVaultStats, { ownerId });
  const notes = useQuery(api.notes.list, { ownerId });

  const recent =
    notes
      ?.filter((n) => !isFolder(n))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 6) ?? [];

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
      <motion.div className="vault-home-hero" variants={fadeUpVariants} transition={easeOutSoft}>
        <div className="vault-home-badge">
          <Sparkles className="size-4" />
          Your knowledge vault
        </div>
        <h1 className="vault-home-title">NoteVault</h1>
        <p className="vault-home-subtitle">
          Capture ideas, organize collections, and build your personal workspace — designed for you,
          not copied from anywhere else.
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
          <motion.button
            type="button"
            className="vault-btn-secondary"
            onClick={onCreateCollection}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FolderOpen className="size-4" />
            New collection
          </motion.button>
          <motion.button
            type="button"
            className="vault-btn-secondary"
            onClick={() => setShareOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Share2 className="size-4" />
            Share vault
          </motion.button>
          <motion.button
            type="button"
            className="vault-btn-secondary"
            onClick={onQuickCapture}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap className="size-4" />
            Quick capture
          </motion.button>
        </div>
      </motion.div>

      {stats && (
        <motion.div className="vault-stats" variants={staggerContainer}>
          <StatCard label="Entries" value={stats.entries} icon={<FileText className="size-4" />} />
          <StatCard label="Collections" value={stats.collections} icon={<FolderOpen className="size-4" />} />
          <StatCard label="Open tasks" value={stats.openTasks} icon={<CheckSquare className="size-4" />} />
          <StatCard label="Favorites" value={stats.favorites} icon={<Sparkles className="size-4" />} />
        </motion.div>
      )}

      <motion.section className="vault-section" variants={fadeUpVariants} transition={easeOutSoft}>
        <h2 className="vault-section-title">Start from a template</h2>
        <motion.div className="template-grid" variants={staggerContainer}>
          {PAGE_TEMPLATES.filter((t) => t.id !== "blank").map((template) => (
            <motion.button
              key={template.id}
              type="button"
              className="template-card"
              onClick={() => onCreateEntry(template.id)}
              variants={staggerItem}
              whileHover={{ y: -2, borderColor: "var(--accent)" }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-2xl">{template.icon}</span>
              <span className="font-medium">{template.name}</span>
              <span className="text-xs text-muted">{template.description}</span>
            </motion.button>
          ))}
        </motion.div>
      </motion.section>

      {openTaskEntries.length > 0 && (
        <motion.section className="vault-section" variants={fadeUpVariants} transition={easeOutSoft}>
          <h2 className="vault-section-title">Open tasks</h2>
          <div className="vault-task-list">
            {openTaskEntries.map((entry) => (
              <motion.button
                key={entry._id}
                type="button"
                className="vault-task-item"
                onClick={() => onNavigate(entry._id)}
                whileHover={{ x: 2 }}
              >
                <span>{entry.icon}</span>
                <span className="flex-1 truncate text-left">{entry.title || "Untitled"}</span>
                <span className="text-xs text-accent">{countOpenTasks(entry.blocks)} tasks</span>
                <ArrowRight className="size-4 text-muted" />
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      <motion.section className="vault-section" variants={fadeUpVariants} transition={easeOutSoft}>
        <h2 className="vault-section-title">Recently edited</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted">No entries yet — create your first one above.</p>
        ) : (
          <motion.div className="vault-recent-grid" variants={staggerContainer}>
            {recent.map((entry) => (
              <motion.button
                key={entry._id}
                type="button"
                className="vault-recent-card"
                onClick={() => onNavigate(entry._id)}
                variants={staggerItem}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-2xl">{entry.icon}</span>
                <span className="truncate font-medium">{entry.title || "Untitled"}</span>
                <span className="text-xs text-muted">{formatRelativeTime(entry.updatedAt)}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </motion.section>

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

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <motion.div className="vault-stat-card" variants={staggerItem} whileHover={{ y: -2 }}>
      <div className="text-muted">{icon}</div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </motion.div>
  );
}
