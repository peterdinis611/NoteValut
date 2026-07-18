"use client";

import { useQuery } from "convex/react";
import { Tag, X } from "lucide-react";
import { KeyboardEvent, useMemo, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import {
  addTagToList,
  normalizeTag,
  removeTagFromList,
  tagKey,
} from "@/lib/tags";
import { useToast } from "./toast";

type Props = {
  tags: string[];
  updatedAt: number;
  ownerId?: string;
  readOnly?: boolean;
  onChange: (tags: string[]) => void;
  onOpenTag?: (tag: string) => void;
};

export function PageProperties({
  tags,
  updatedAt,
  ownerId,
  readOnly,
  onChange,
  onOpenTag,
}: Props) {
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [editingTags, setEditingTags] = useState(false);
  const [suggestIndex, setSuggestIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const vaultTags = useQuery(
    api.notes.listTags,
    ownerId && editingTags ? { ownerId } : "skip",
  );

  const suggestions = useMemo(() => {
    const q = tagKey(normalizeTag(draft));
    if (!vaultTags?.length) return [];
    const existing = new Set(tags.map(tagKey));
    return vaultTags
      .filter((t) => !existing.has(t.key) && (!q || t.key.includes(q)))
      .slice(0, 6);
  }, [vaultTags, draft, tags]);

  function addTag(raw: string) {
    const result = addTagToList(tags, raw);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    if (result.tags.length === tags.length) {
      setDraft("");
      return;
    }
    onChange(result.tags);
    setDraft("");
    setSuggestIndex(0);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setSuggestIndex((i) => {
        if (e.key === "ArrowDown") return (i + 1) % suggestions.length;
        return (i - 1 + suggestions.length) % suggestions.length;
      });
      return;
    }
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (e.key === "Enter" && suggestions[suggestIndex]) {
        addTag(suggestions[suggestIndex].tag);
      } else {
        addTag(draft);
      }
    }
    if (e.key === "Backspace" && !draft && tags.length) {
      onChange(tags.slice(0, -1));
    }
    if (e.key === "Escape") {
      if (suggestions.length) setDraft("");
      else setEditingTags(false);
    }
  }

  return (
    <div className="page-properties">
      <div className="page-property-row">
        <span className="page-property-label">Last edited</span>
        <span className="page-property-value">
          {new Date(updatedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="page-property-row">
        <span className="page-property-label">
          <Tag className="mr-1 inline size-3" />
          Tags
        </span>
        <div className="page-property-value flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="page-tag">
              {onOpenTag ? (
                <button
                  type="button"
                  className="page-tag-label"
                  onClick={() => onOpenTag(tag)}
                  title={`Browse #${tag}`}
                >
                  {tag}
                </button>
              ) : (
                tag
              )}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                className="page-tag-remove"
                disabled={readOnly}
                onClick={() => onChange(removeTagFromList(tags, tag))}
              >
                <X className="size-2.5" />
              </button>
            </span>
          ))}
          {editingTags ? (
            <div className="page-tag-suggest-wrap">
              <input
                ref={inputRef}
                autoFocus
                className="page-tag-input"
                placeholder="Add tag…"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setSuggestIndex(0);
                }}
                onKeyDown={onKeyDown}
                onBlur={() => {
                  // Delay so suggestion click can fire
                  window.setTimeout(() => {
                    addTag(draft);
                    setEditingTags(false);
                  }, 120);
                }}
              />
              {suggestions.length > 0 && (
                <ul className="page-tag-suggest" role="listbox">
                  {suggestions.map((s, i) => (
                    <li key={s.key}>
                      <button
                        type="button"
                        className={`page-tag-suggest-item ${i === suggestIndex ? "page-tag-suggest-item-active" : ""}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addTag(s.tag);
                          inputRef.current?.focus();
                        }}
                      >
                        #{s.tag}
                        <span className="page-tag-suggest-count">{s.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : !readOnly ? (
            <button type="button" className="page-tag-add" onClick={() => setEditingTags(true)}>
              {tags.length ? "Add" : "Empty"}
            </button>
          ) : tags.length === 0 ? (
            <span className="text-xs text-muted">—</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
