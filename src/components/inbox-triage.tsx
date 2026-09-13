"use client";

import { useMutation } from "convex/react";
import { Archive, FolderInput, Inbox, Sun, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { AnimePresence } from "@/lib/anime-ui";
import { isFolder } from "@/lib/item-kinds";
import { useToast } from "./toast";

type Props = {
  ownerId: string;
  notes: Doc<"notes">[] | undefined;
  open: boolean;
  onClose: () => void;
  onNavigate: (id: Id<"notes">) => void;
  onOpenToday: () => void | Promise<void>;
};

export function InboxTriage({
  ownerId,
  notes,
  open,
  onClose,
  onNavigate,
  onOpenToday,
}: Props) {
  const toast = useToast();
  const updateNote = useMutation(api.notes.update);
  const getOrCreateDaily = useMutation(api.notes.getOrCreateDaily);
  const [mounted, setMounted] = useState(false);
  const [moveFor, setMoveFor] = useState<Id<"notes"> | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setMoveFor(null);
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (moveFor) setMoveFor(null);
        else onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, moveFor]);

  const inbox = useMemo(() => {
    if (!notes) return null;
    return (
      notes.find(
        (n) =>
          isFolder(n) &&
          !n.trashed &&
          (n.title || "").trim().toLowerCase() === "inbox",
      ) ?? null
    );
  }, [notes]);

  const children = useMemo(() => {
    if (!notes || !inbox) return [];
    return notes
      .filter((n) => !n.trashed && !n.archived && n.parentId === inbox._id && !isFolder(n))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, inbox]);

  const projects = useMemo(() => {
    if (!notes) return [];
    return notes.filter((n) => isFolder(n) && !n.trashed && n._id !== inbox?._id);
  }, [notes, inbox]);

  async function moveToToday(id: Id<"notes">) {
    try {
      const dailyKey = new Date().toISOString().slice(0, 10);
      const todayId = await getOrCreateDaily({ ownerId, dailyKey });
      await updateNote({ id, parentId: todayId });
      toast.success("Moved to Today");
      void onOpenToday();
    } catch {
      toast.error("Couldn’t move to Today");
    }
  }

  async function moveToProject(id: Id<"notes">, parentId: Id<"notes">) {
    try {
      await updateNote({ id, parentId });
      toast.success("Moved to collection");
      setMoveFor(null);
    } catch {
      toast.error("Couldn’t move");
    }
  }

  async function archive(id: Id<"notes">) {
    try {
      await updateNote({ id, archived: true });
      toast.success("Archived");
    } catch {
      toast.error("Couldn’t archive");
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimePresence show={open} kind="overlay">
      <div className="share-overlay" onClick={onClose}>
        <div
          className="share-panel inbox-triage"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inbox-triage-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="share-panel-header">
            <div className="share-panel-heading">
              <span className="share-panel-icon" aria-hidden>
                <Inbox className="size-4" />
              </span>
              <div>
                <h2 id="inbox-triage-title" className="share-panel-title">
                  Inbox triage
                </h2>
                <p className="share-panel-subtitle">
                  Clear pages from your Inbox collection
                </p>
              </div>
            </div>
            <button
              type="button"
              className="share-panel-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </header>

          <div className="inbox-triage-body note-scroll">
            {!notes ? (
              <p className="inbox-triage-empty">Loading…</p>
            ) : !inbox ? (
              <p className="inbox-triage-empty">
                No collection titled “Inbox”. Create one to triage captures here.
              </p>
            ) : children.length === 0 ? (
              <p className="inbox-triage-empty">Inbox is clear — nice work.</p>
            ) : (
              <ul className="inbox-triage-list">
                {children.map((item) => (
                  <li key={item._id} className="inbox-triage-item">
                    <button
                      type="button"
                      className="inbox-triage-open"
                      onClick={() => {
                        onNavigate(item._id);
                        onClose();
                      }}
                    >
                      <span className="inbox-triage-icon">{item.icon}</span>
                      <span className="inbox-triage-title">
                        {item.title || "Untitled"}
                      </span>
                    </button>
                    <div className="inbox-triage-actions">
                      <button
                        type="button"
                        className="inbox-triage-btn"
                        title="Move to Today"
                        onClick={() => void moveToToday(item._id)}
                      >
                        <Sun className="size-3.5" />
                        Today
                      </button>
                      <button
                        type="button"
                        className="inbox-triage-btn"
                        title="Move to project"
                        onClick={() => setMoveFor(moveFor === item._id ? null : item._id)}
                      >
                        <FolderInput className="size-3.5" />
                        Project
                      </button>
                      <button
                        type="button"
                        className="inbox-triage-btn"
                        title="Archive"
                        onClick={() => void archive(item._id)}
                      >
                        <Archive className="size-3.5" />
                        Archive
                      </button>
                    </div>
                    {moveFor === item._id && (
                      <div className="inbox-triage-picker">
                        <p className="inbox-triage-picker-label">Move to collection</p>
                        <div className="inbox-triage-picker-list">
                          {projects.length === 0 ? (
                            <p className="text-muted text-xs">No other collections</p>
                          ) : (
                            projects.map((p) => (
                              <button
                                key={p._id}
                                type="button"
                                className="inbox-triage-picker-item"
                                onClick={() => void moveToProject(item._id, p._id)}
                              >
                                <span>{p.icon || "🗂️"}</span>
                                <span>{p.title || "Untitled"}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AnimePresence>,
    document.body,
  );
}
