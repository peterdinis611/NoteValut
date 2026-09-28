"use client";

import { useAction } from "convex/react";
import { Link2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AnimePresence } from "@/lib/anime-ui";
import { MarkdownView } from "./markdown-view";
import { useToast } from "./toast";

type Props = {
  ownerId: string;
  open: boolean;
  onClose: () => void;
  noteId?: Id<"notes"> | null;
  onNavigate?: (id: Id<"notes">) => void;
};

type Cite = { id: Id<"notes">; title: string; icon: string };

export function AiVaultPanel({ ownerId, open, onClose, noteId, onNavigate }: Props) {
  const toast = useToast();
  const chat = useAction(api.ai.chat);
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [cites, setCites] = useState<Cite[]>([]);
  const [busy, setBusy] = useState(false);

  async function run(mode: "chat" | "summary" | "links", text?: string) {
    setBusy(true);
    try {
      const res = await chat({
        ownerId,
        message: text ?? message,
        mode,
        noteId: noteId ?? undefined,
      });
      setAnswer(res.answer);
      setCites(
        (res.cites ?? []).map((c) => ({
          id: c.id as Id<"notes">,
          title: c.title,
          icon: c.icon,
        })),
      );
    } catch {
      toast.error("AI request failed");
    } finally {
      setBusy(false);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimePresence show={open} kind="overlay">
      <div className="share-overlay" onClick={onClose}>
        <div
          className="share-panel ai-vault-panel"
          role="dialog"
          aria-modal
          aria-labelledby="ai-vault-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="share-panel-header">
            <div className="share-panel-heading">
              <span className="share-panel-icon" aria-hidden>
                <Sparkles className="size-4" />
              </span>
              <div>
                <h2 id="ai-vault-title" className="share-panel-title">
                  Vault AI
                </h2>
                <p className="share-panel-subtitle">
                  Chat, summarize, suggest [[links]] — semantic retrieval
                </p>
              </div>
            </div>
            <button type="button" className="share-panel-close" onClick={onClose} aria-label="Close">
              <X className="size-4" />
            </button>
          </header>

          <div className="ai-vault-actions">
            <button
              type="button"
              className="settings-btn"
              disabled={busy || !noteId}
              onClick={() => void run("summary", "Summarize this page")}
            >
              Summarize page
            </button>
            <button
              type="button"
              className="settings-btn settings-btn-ghost"
              disabled={busy}
              onClick={() => void run("links", message || "related notes")}
            >
              <Link2 className="size-3.5" />
              Suggest links
            </button>
          </div>

          <form
            className="ai-vault-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!message.trim()) return;
              void run("chat");
            }}
          >
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask your vault…"
              rows={3}
            />
            <button type="submit" className="settings-btn" disabled={busy || !message.trim()}>
              {busy ? "Thinking…" : "Ask"}
            </button>
          </form>

          {answer && (
            <div className="ai-vault-answer note-scroll">
              <MarkdownView streaming>{answer}</MarkdownView>
              {cites.length > 0 && (
                <ul className="ai-vault-cites">
                  {cites.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate?.(c.id);
                          onClose();
                        }}
                      >
                        {c.icon} {c.title || "Untitled"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </AnimePresence>,
    document.body,
  );
}
