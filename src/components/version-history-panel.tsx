"use client";

import { useMutation, useQuery } from "convex/react";
import { Diff, History, RotateCcw, Tag, X } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AnimePresence } from "@/lib/anime-ui";
import { blocksToMarkdown, type Block } from "@/lib/blocks";
import { formatRelativeTime } from "@/lib/format";
import { useToast } from "./toast";

type Props = {
  open: boolean;
  onClose: () => void;
  noteId: Id<"notes">;
  readOnly?: boolean;
};

type DiffLine = { type: "same" | "add" | "del"; text: string };

function lineDiff(a: string, b: string): DiffLine[] {
  const left = a.split("\n");
  const right = b.split("\n");
  const out: DiffLine[] = [];
  const max = Math.max(left.length, right.length);
  // Simple LCS-ish scan: mark unmatched as add/del
  let i = 0;
  let j = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && left[i] === right[j]) {
      out.push({ type: "same", text: left[i]! });
      i += 1;
      j += 1;
      continue;
    }
    if (j < right.length && (i >= left.length || !left.slice(i).includes(right[j]!))) {
      out.push({ type: "add", text: right[j]! });
      j += 1;
      continue;
    }
    if (i < left.length) {
      out.push({ type: "del", text: left[i]! });
      i += 1;
      continue;
    }
    out.push({ type: "add", text: right[j++]! });
  }
  if (out.length > max * 3) {
    // fallback compact
    return [
      ...left.map((t) => ({ type: "del" as const, text: t })),
      ...right.map((t) => ({ type: "add" as const, text: t })),
    ];
  }
  return out;
}

export function VersionHistoryPanel({ open, onClose, noteId, readOnly = false }: Props) {
  const toast = useToast();
  const versions = useQuery(api.versions.listForNote, open ? { noteId } : "skip");
  const note = useQuery(api.notes.get, open ? { id: noteId } : "skip");
  const restore = useMutation(api.versions.restore);
  const createNamed = useMutation(api.versions.createNamed);
  const nameSnapshot = useMutation(api.versions.nameSnapshot);

  const [selectedId, setSelectedId] = useState<Id<"noteVersions"> | null>(null);
  const [labelDraft, setLabelDraft] = useState("");
  const selected = useQuery(
    api.versions.get,
    open && selectedId ? { id: selectedId } : "skip",
  );

  const currentMd = useMemo(() => {
    if (!note) return "";
    if (note.blocks?.length) return blocksToMarkdown(note.blocks as Block[]);
    return note.content || "";
  }, [note]);

  const versionMd = useMemo(() => {
    if (!selected) return "";
    if (selected.blocks?.length) return blocksToMarkdown(selected.blocks as Block[]);
    return selected.content || "";
  }, [selected]);

  const diff = useMemo(
    () => (selected ? lineDiff(versionMd, currentMd) : []),
    [selected, versionMd, currentMd],
  );

  async function handleRestore(versionId: Id<"noteVersions">) {
    if (readOnly) return;
    try {
      await restore({ noteId, versionId });
      toast.success("Version restored");
      onClose();
    } catch {
      toast.error("Couldn’t restore version");
    }
  }

  async function saveNamed() {
    if (readOnly || !labelDraft.trim()) return;
    try {
      await createNamed({ noteId, label: labelDraft.trim() });
      setLabelDraft("");
      toast.success("Named snapshot saved");
    } catch {
      toast.error("Couldn’t save snapshot");
    }
  }

  return (
    <AnimePresence show={open} kind="overlay">
      <div className="share-overlay" onClick={onClose}>
        <div
          className="history-panel history-panel-wide"
          role="dialog"
          aria-modal
          aria-labelledby="history-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="share-panel-header">
            <div>
              <h2 id="history-title" className="flex items-center gap-2 text-base font-semibold">
                <History className="size-4 text-accent" />
                Version history
              </h2>
              <p className="text-xs text-muted">
                Last {versions?.length ?? 0} snapshots · click a row to diff
              </p>
            </div>
            <button type="button" className="topbar-btn" onClick={onClose} aria-label="Close">
              <X className="size-4" />
            </button>
          </div>

          {!readOnly && (
            <div className="history-name-row">
              <input
                className="settings-css-var-input"
                placeholder="Name this snapshot…"
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveNamed();
                }}
              />
              <button type="button" className="settings-btn" onClick={() => void saveNamed()}>
                <Tag className="size-3.5" />
                Save named
              </button>
            </div>
          )}

          <div className="history-split">
            <div className="history-list note-scroll">
              {versions === undefined ? (
                <p className="settings-empty">Loading…</p>
              ) : versions.length === 0 ? (
                <p className="settings-empty">
                  No snapshots yet — edits create history automatically.
                </p>
              ) : (
                versions.map((ver) => (
                  <button
                    key={ver._id}
                    type="button"
                    className={`history-row history-row-btn ${selectedId === ver._id ? "is-active" : ""}`}
                    onClick={() => setSelectedId(ver._id)}
                  >
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-medium">
                        {ver.label ? (
                          <span className="history-label">{ver.label}</span>
                        ) : null}
                        {ver.title || "Untitled"}
                      </p>
                      <p className="text-xs text-muted">
                        {formatRelativeTime(ver.createdAt)} · {ver.blockCount} blocks
                      </p>
                      {ver.preview.trim() && <p className="history-preview">{ver.preview}</p>}
                    </div>
                    <span
                      className="settings-btn"
                      role="presentation"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleRestore(ver._id);
                      }}
                    >
                      <RotateCcw className="size-3.5" />
                      Restore
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="history-diff note-scroll">
              {!selectedId ? (
                <p className="settings-empty">
                  <Diff className="size-4 inline" /> Select a snapshot to see the diff vs current.
                </p>
              ) : selected === undefined ? (
                <p className="settings-empty">Loading diff…</p>
              ) : (
                <>
                  <div className="history-diff-head">
                    <span>Snapshot → Current</span>
                    {!readOnly && (
                      <button
                        type="button"
                        className="settings-btn settings-btn-ghost"
                        onClick={() => {
                          if (!selected) return;
                          const name = window.prompt("Name this snapshot", selected.label ?? "");
                          if (name == null) return;
                          void nameSnapshot({ versionId: selected._id, label: name }).then(
                            () => toast.success("Label updated"),
                            () => toast.error("Couldn’t rename"),
                          );
                        }}
                      >
                        Rename
                      </button>
                    )}
                  </div>
                  <pre className="history-diff-pre">
                    {diff.map((line, i) => (
                      <div key={i} className={`history-diff-line is-${line.type}`}>
                        <span className="history-diff-mark">
                          {line.type === "add" ? "+" : line.type === "del" ? "−" : " "}
                        </span>
                        {line.text || " "}
                      </div>
                    ))}
                  </pre>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimePresence>
  );
}
