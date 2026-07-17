"use client";

import { Tag, X } from "lucide-react";
import { KeyboardEvent, useState } from "react";
import { firstIssue, parseTags } from "@/lib/validation";
import { useToast } from "./toast";

type Props = {
  tags: string[];
  updatedAt: number;
  readOnly?: boolean;
  onChange: (tags: string[]) => void;
};

export function PageProperties({ tags, updatedAt, readOnly, onChange }: Props) {
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [editingTags, setEditingTags] = useState(false);

  function addTag(raw: string) {
    const tag = raw.trim().replace(/^#/, "");
    if (!tag) {
      setDraft("");
      return;
    }
    if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      return;
    }
    const next = [...tags, tag];
    const parsed = parseTags(next);
    if (!parsed.success) {
      toast.error(firstIssue(parsed));
      return;
    }
    onChange(parsed.output);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    }
    if (e.key === "Backspace" && !draft && tags.length) {
      onChange(tags.slice(0, -1));
    }
    if (e.key === "Escape") setEditingTags(false);
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
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                className="page-tag-remove"
                disabled={readOnly}
                onClick={() => onChange(tags.filter((t) => t !== tag))}
              >
                <X className="size-2.5" />
              </button>
            </span>
          ))}
          {editingTags ? (
            <input
              autoFocus
              className="page-tag-input"
              placeholder="Add tag…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={() => {
                addTag(draft);
                setEditingTags(false);
              }}
            />
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
