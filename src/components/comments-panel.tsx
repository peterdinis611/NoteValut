"use client";

import { useMutation, useQuery } from "convex/react";
import { AtSign, Check, MessageSquare, Trash2 } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
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

function highlightMentions(body: string) {
  const parts = body.split(/(@[^\s@]+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="page-comments-mention">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
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
  const people = useQuery(api.comments.listPeople, open ? { ownerId } : "skip");
  const create = useMutation(api.comments.create);
  const resolve = useMutation(api.comments.resolve);
  const remove = useMutation(api.comments.remove);

  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mentionHits = useMemo(() => {
    if (mentionQuery === null || !people) return [];
    const q = mentionQuery.toLowerCase();
    return people
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [people, mentionQuery]);

  if (!open) return null;

  function detectMention(value: string, caret: number) {
    const before = value.slice(0, caret);
    const m = before.match(/@([^\s@]*)$/);
    if (!m) {
      setMentionQuery(null);
      return;
    }
    setMentionQuery(m[1] ?? "");
    setMentionIndex(0);
  }

  function insertMention(person: { id: string; name: string }) {
    const el = textareaRef.current;
    if (!el) return;
    const caret = el.selectionStart;
    const before = body.slice(0, caret);
    const after = body.slice(caret);
    const replaced = before.replace(/@([^\s@]*)$/, `@${person.id} `);
    const next = replaced + after;
    setBody(next);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      el.focus();
      const pos = replaced.length;
      el.setSelectionRange(pos, pos);
    });
  }

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
      setMentionQuery(null);
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

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery === null || mentionHits.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionIndex((i) => Math.min(i + 1, mentionHits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const hit = mentionHits[mentionIndex];
      if (hit) insertMention(hit);
    } else if (e.key === "Escape") {
      setMentionQuery(null);
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
        <p className="page-comments-empty">No comments yet — @mention people from share links</p>
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
              <p className="page-comments-body">{highlightMentions(c.body)}</p>
              {(c.mentionIds?.length ?? 0) > 0 && (
                <p className="page-comments-tagged">
                  <AtSign className="size-3" />
                  {c.mentionIds!.map((m) => `@${m}`).join(" ")}
                </p>
              )}
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
        <div className="page-comments-compose-wrap">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              detectMention(e.target.value, e.target.selectionStart);
            }}
            onKeyDown={onKeyDown}
            onClick={(e) =>
              detectMention(e.currentTarget.value, e.currentTarget.selectionStart)
            }
            placeholder="Add a comment… Type @ to mention"
            rows={2}
            maxLength={4000}
            aria-label="New comment"
          />
          {mentionQuery !== null && mentionHits.length > 0 && (
            <ul className="page-comments-people" role="listbox">
              {mentionHits.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={i === mentionIndex ? "is-active" : undefined}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMention(p);
                    }}
                  >
                    <AtSign className="size-3" />
                    <span>{p.name}</span>
                    <span className="page-comments-people-src">{p.source}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" disabled={busy || !body.trim()} className="page-comments-submit">
          {busy ? "Posting…" : "Comment"}
        </button>
      </form>
    </section>
  );
}
