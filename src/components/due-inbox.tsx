"use client";

import { useQuery } from "convex/react";
import {
  CalendarClock,
  CheckCircle2,
  Inbox,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  collectDueTasks,
  formatDueLabel,
  groupDueTasks,
  type DueBucket,
} from "@/lib/due-tasks";
import { easeOutSoft, fadeUpVariants } from "@/lib/motion";

type Props = {
  ownerId: string;
  onClose: () => void;
  onNavigate: (id: Id<"notes">) => void;
};

const TABS: { id: DueBucket | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
];

export function DueInbox({ ownerId, onClose, onNavigate }: Props) {
  const notes = useQuery(api.notes.list, { ownerId });
  const [tab, setTab] = useState<DueBucket | "all">("all");

  const hits = useMemo(() => collectDueTasks(notes), [notes]);
  const groups = useMemo(() => groupDueTasks(hits), [hits]);

  const visible = useMemo(() => {
    if (tab === "all") {
      return [
        ...groups.overdue,
        ...groups.today,
        ...groups.upcoming,
        ...groups.later,
      ];
    }
    return groups[tab];
  }, [groups, tab]);

  const counts = {
    all: hits.length,
    overdue: groups.overdue.length,
    today: groups.today.length,
    upcoming: groups.upcoming.length + groups.later.length,
  };

  return (
    <motion.div
      className="due-inbox note-scroll"
      initial="hidden"
      animate="visible"
      variants={fadeUpVariants}
      transition={easeOutSoft}
    >
      <header className="settings-header">
        <div>
          <p className="settings-kicker">
            <Inbox className="size-3.5" />
            Tasks
          </p>
          <h1 className="settings-title">Due inbox</h1>
          <p className="settings-subtitle">
            Open todos with due dates across your vault — overdue, today, and
            upcoming.
          </p>
        </div>
        <button
          type="button"
          className="settings-close"
          onClick={onClose}
          aria-label="Close due inbox"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="due-inbox-tabs" role="tablist" aria-label="Due filters">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`due-inbox-tab ${tab === t.id ? "due-inbox-tab-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="due-inbox-tab-count">
              {t.id === "upcoming"
                ? counts.upcoming
                : t.id === "all"
                  ? counts.all
                  : t.id === "overdue"
                    ? counts.overdue
                    : counts.today}
            </span>
          </button>
        ))}
      </div>

      {notes === undefined ? (
        <p className="due-inbox-empty">Loading tasks…</p>
      ) : visible.length === 0 ? (
        <div className="due-inbox-empty-card">
          <CheckCircle2 className="size-6 opacity-50" />
          <p>
            {tab === "overdue"
              ? "Nothing overdue — nice."
              : tab === "today"
                ? "No tasks due today."
                : "No due tasks yet. Add a date on a todo block."}
          </p>
        </div>
      ) : (
        <ul className="due-inbox-list">
          {visible.map((task) => (
            <li key={`${task.noteId}-${task.blockId}`}>
              <button
                type="button"
                className={`due-inbox-item ${task.overdue ? "due-inbox-item-overdue" : ""}`}
                onClick={() => onNavigate(task.noteId)}
              >
                <span className="due-inbox-icon">{task.noteIcon}</span>
                <span className="due-inbox-main">
                  <span className="due-inbox-text">{task.text}</span>
                  <span className="due-inbox-note">{task.noteTitle}</span>
                </span>
                <span
                  className={`due-inbox-badge ${task.overdue ? "due-inbox-badge-overdue" : ""}`}
                >
                  <CalendarClock className="size-3" />
                  {formatDueLabel(task.dueAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
