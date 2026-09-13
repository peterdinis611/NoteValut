"use client";

import { useMutation, useQuery } from "convex/react";
import { Check, MessageSquare, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useToast } from "./toast";

type Props = {
  ownerId: string;
  noteId: Id<"notes">;
  authorId: string;
  authorName: string;
  open?: boolean;
};

function parseMentions(body: string): string[] {
  const ids = new Set<string>();
  for (const match of body.matchAll(/@([^\s@]+)/g)) {
    const id = match[1]?.trim();
    if (id) ids.add(id);
  }
  return [...ids];
}

export function CommentsPanel({
  ownerId,
  noteId,
  authorId,
  authorName,
  open = true,
}: Props) {
  const toast = useToast();
  const comments = useQuery(api.comments.listForNote, open ? { ownerId, noteId } : "skip");
  const create = useMutation(api.comments.create);
  const resolve = useMutation(api.comments.resolve);
  const remove = useMutation(api.comments.remove);

  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await create({
        ownerId,
        noteId,
        authorId,
        authorName,
        body: trimmed,
        mentionIds: parseMentions(trimmed),
      });
      setBody("");
      toast.success("Comment added");
    } catch {
      toast.error("Couldn’t add comment");
    } finally {
      setBusy(false);
    }
  }

  async function handleResolve(commentId: Id<"comments">, resolved: boolean) {
    try {
      await resolve({ ownerId, commentId, resolved });
      toast.success(resolved ? "Resolved" : "Reopened");
    } catch {
      toast.error("Couldn’t update comment");
    }
  }

  async function handleRemove(commentId: Id<"comments">) {
    try {
      await remove({ ownerId, commentId });
      toast.success("Comment removed");
    } catch {
      toast.error("Couldn’t remove comment");
    }
  }

  const list = comments ?? [];

  return (
    <section className="page-comments" aria-label="Comments">
      <div className="page-comments-head">
        <MessageSquare className="size-3.5" />
        <span>
          {comments === undefined
            ? "Comments"
            : `${list.length} comment${list.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {comments === undefined ? (
        <p className="page-comments-empty">Loading…</p>
      ) : list.length === 0 ? (
        <p className="page-comments-empty">No comments yet</p>
      ) : (
        <ul className="page-comments-list">
          {list.map((c) => (
            <li
              key={c._id}
              className={`page-comments-item ${c.resolved ? "page-comments-item-resolved" : ""}`}
            >
              <div className="page-comments-meta">
                <strong>{c.authorName}</strong>
                <time dateTime={new Date(c.createdAt).toISOString()}>
                  {new Date(c.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
                {c.resolved && <span className="page-comments-badge">Resolved</span>}
              </div>
              <p className="page-comments-body">{c.body}</p>
              <div className="page-comments-actions">
                <button
                  type="button"
                  className="page-comments-action"
                  onClick={() => void handleResolve(c._id, !c.resolved)}
                >
                  <Check className="size-3" />
                  {c.resolved ? "Reopen" : "Resolve"}
                </button>
                <button
                  type="button"
                  className="page-comments-action page-comments-action-danger"
                  onClick={() => void handleRemove(c._id)}
                >
                  <Trash2 className="size-3" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="page-comments-composer" onSubmit={(e) => void handleSubmit(e)}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment… Use @name to mention"
          rows={2}
          maxLength={4000}
          aria-label="New comment"
        />
        <button type="submit" disabled={busy || !body.trim()} className="page-comments-submit">
          {busy ? "Posting…" : "Comment"}
        </button>
      </form>
    </section>
  );
}
