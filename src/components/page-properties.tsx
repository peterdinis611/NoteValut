"use client";

import { useMutation, useQuery } from "convex/react";
import { Tag, X } from "lucide-react";
import { KeyboardEvent, useMemo, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import {
  defaultPropertyDefs,
  evalFormula,
  evalRollup,
  formatPropValue,
  type PropertyDef,
  type PropertyMap,
  type PropertyValue,
} from "@/lib/properties";
import { addTagToList, normalizeTag, removeTagFromList, tagKey } from "@/lib/tags";
import { STATUS_OPTIONS } from "@/lib/status";
import { useToast } from "./toast";
import { isFolder } from "@/lib/item-kinds";

type Props = {
  note: Doc<"notes">;
  tags: string[];
  updatedAt: number;
  ownerId?: string;
  readOnly?: boolean;
  onChangeTags: (tags: string[]) => void;
  onChangeStatus?: (status: string | null) => void;
  onChangeProperties?: (properties: PropertyMap) => void;
  onOpenTag?: (tag: string) => void;
  onNavigate?: (id: Id<"notes">) => void;
};

export function PageProperties({
  note,
  tags,
  updatedAt,
  ownerId,
  readOnly,
  onChangeTags,
  onChangeStatus,
  onChangeProperties,
  onOpenTag,
  onNavigate,
}: Props) {
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [editingTags, setEditingTags] = useState(false);
  const [suggestIndex, setSuggestIndex] = useState(0);
  const [relationOpen, setRelationOpen] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const parent = useQuery(
    api.notes.get,
    note.parentId ? { id: note.parentId } : "skip",
  );
  const vaultTags = useQuery(api.notes.listTags, ownerId && editingTags ? { ownerId } : "skip");
  const linkable = useQuery(
    api.notes.list,
    ownerId && relationOpen ? { ownerId } : "skip",
  );

  const defs: PropertyDef[] = useMemo(() => {
    const fromFolder = (parent?.propertyDefs as PropertyDef[] | undefined) ?? [];
    if (fromFolder.length) return fromFolder;
    return defaultPropertyDefs();
  }, [parent?.propertyDefs]);

  const properties = (note.properties ?? {}) as PropertyMap;

  const pagesById = useMemo(() => {
    const map = new Map<string, Doc<"notes">>();
    for (const n of linkable ?? []) {
      if (!isFolder(n) && !n.trashed) map.set(n._id, n);
    }
    return map;
  }, [linkable]);

  const suggestions = useMemo(() => {
    const q = tagKey(normalizeTag(draft));
    if (!vaultTags?.length) return [];
    const existing = new Set(tags.map(tagKey));
    return vaultTags.filter((t) => !existing.has(t.key) && (!q || t.key.includes(q))).slice(0, 6);
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
    onChangeTags(result.tags);
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
      onChangeTags(tags.slice(0, -1));
    }
    if (e.key === "Escape") {
      if (suggestions.length) setDraft("");
      else setEditingTags(false);
    }
  }

  function setProp(def: PropertyDef, value: PropertyValue) {
    if (def.id === "status") {
      onChangeStatus?.(value ? String(value) : null);
      return;
    }
    const next = { ...properties, [def.id]: value };
    onChangeProperties?.(next);
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

      {defs.map((def) => {
        if (def.id === "tags") return null;
        const raw =
          def.id === "status" ? note.status || "" : properties[def.id];

        return (
          <div key={def.id} className="page-property-row">
            <span className="page-property-label">{def.name}</span>
            <div className="page-property-value">
              {readOnly ? (
                <span className="text-sm">{formatPropValue(def, raw)}</span>
              ) : def.type === "select" || def.id === "status" ? (
                <select
                  className="page-prop-input"
                  value={String(raw ?? "")}
                  onChange={(e) => setProp(def, e.target.value || null)}
                >
                  <option value="">—</option>
                  {(def.options ?? (def.id === "status" ? [...STATUS_OPTIONS].filter(Boolean) : [])).map(
                    (opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ),
                  )}
                </select>
              ) : def.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={Boolean(raw)}
                  onChange={(e) => setProp(def, e.target.checked)}
                />
              ) : def.type === "number" ? (
                <input
                  type="number"
                  className="page-prop-input"
                  value={raw == null ? "" : String(raw)}
                  onChange={(e) =>
                    setProp(def, e.target.value === "" ? null : Number(e.target.value))
                  }
                />
              ) : def.type === "date" ? (
                <input
                  type="date"
                  className="page-prop-input"
                  value={
                    typeof raw === "number"
                      ? new Date(raw).toISOString().slice(0, 10)
                      : typeof raw === "string"
                        ? raw.slice(0, 10)
                        : ""
                  }
                  onChange={(e) =>
                    setProp(
                      def,
                      e.target.value ? new Date(e.target.value).getTime() : null,
                    )
                  }
                />
              ) : def.type === "formula" ? (
                <span className="text-sm page-prop-computed" title={def.formula}>
                  {
                    evalFormula(def.formula, {
                      properties,
                      status: note.status,
                      defs,
                    }).display
                  }
                </span>
              ) : def.type === "rollup" ? (
                <span className="text-sm page-prop-computed">
                  {(() => {
                    const relIds = properties[def.rollupRelationId ?? ""] ;
                    const ids = Array.isArray(relIds) ? relIds : relIds ? [String(relIds)] : [];
                    const related = ids
                      .map((id) => pagesById.get(id))
                      .filter(Boolean)
                      .map((n) => ({
                        properties: (n!.properties ?? {}) as PropertyMap,
                        status: n!.status,
                      }));
                    return evalRollup(def, related);
                  })()}
                </span>
              ) : def.type === "relation" ? (
                <div className="page-prop-relation">
                  {(Array.isArray(raw) ? raw : raw ? [String(raw)] : []).map((id) => {
                    const page = pagesById.get(String(id));
                    return (
                      <button
                        key={String(id)}
                        type="button"
                        className="page-prop-rel-chip"
                        onClick={() => onNavigate?.(id as Id<"notes">)}
                      >
                        {page ? `${page.icon} ${page.title || "Untitled"}` : String(id).slice(0, 8)}
                        {!readOnly && (
                          <span
                            role="button"
                            tabIndex={0}
                            className="page-prop-rel-x"
                            onClick={(e) => {
                              e.stopPropagation();
                              const cur = Array.isArray(raw) ? [...raw] : [];
                              setProp(
                                def,
                                cur.filter((x) => x !== id),
                              );
                            }}
                          >
                            ×
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {!readOnly && (
                    <button
                      type="button"
                      className="page-tag-add"
                      onClick={() => setRelationOpen(def.id)}
                    >
                      + Link
                    </button>
                  )}
                  {relationOpen === def.id && linkable && (
                    <div className="page-prop-rel-picker">
                      {linkable
                        .filter((n) => !isFolder(n) && !n.trashed && n._id !== note._id)
                        .filter((n) => {
                          if (def.relationFolderId && n.parentId !== def.relationFolderId) {
                            return false;
                          }
                          const cur = Array.isArray(raw) ? raw : [];
                          return !cur.includes(n._id);
                        })
                        .slice(0, 12)
                        .map((n) => (
                          <button
                            key={n._id}
                            type="button"
                            onClick={() => {
                              const cur = Array.isArray(raw) ? [...raw] : [];
                              setProp(def, [...cur, n._id]);
                              setRelationOpen(null);
                            }}
                          >
                            {n.icon} {n.title || "Untitled"}
                          </button>
                        ))}
                      <button type="button" className="text-muted" onClick={() => setRelationOpen(null)}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <input
                  className="page-prop-input"
                  value={raw == null ? "" : String(raw)}
                  placeholder={def.type}
                  onChange={(e) => setProp(def, e.target.value || null)}
                />
              )}
            </div>
          </div>
        );
      })}

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
                onClick={() => onChangeTags(removeTagFromList(tags, tag))}
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

/** Schema editor for collection property defs */
export function CollectionPropertySchema({
  folderId,
  defs,
  readOnly,
}: {
  folderId: Id<"notes">;
  defs: PropertyDef[] | undefined;
  readOnly?: boolean;
}) {
  const updateNote = useMutation(api.notes.update);
  const toast = useToast();
  const list = defs?.length ? defs : defaultPropertyDefs();

  if (readOnly) return null;

  return (
    <div className="db-schema">
      <p className="db-schema-label">Properties</p>
      <ul className="db-schema-list">
        {list.map((d) => (
          <li key={d.id}>
            <strong>{d.name}</strong>
            <span>{d.type}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="settings-btn settings-btn-ghost"
        onClick={() => {
          const name = window.prompt("Property name");
          if (!name?.trim()) return;
          const type = window.prompt(
            "Type: text | number | select | date | checkbox | url | relation | formula | rollup",
            "select",
          );
          const t = (type?.trim() || "text") as PropertyDef["type"];
          const formula =
            t === "formula"
              ? window.prompt("Formula (use prop('Priority') etc.)", "prop('priority')") ?? undefined
              : undefined;
          const next = [
            ...list,
            {
              id: crypto.randomUUID().slice(0, 8),
              name: name.trim(),
              type: t,
              options: t === "select" ? ["Option A", "Option B"] : undefined,
              formula,
              rollupAgg: t === "rollup" ? ("count" as const) : undefined,
            },
          ];
          void updateNote({ id: folderId, propertyDefs: next }).then(
            () => toast.success("Property added"),
            () => toast.error("Couldn’t add property"),
          );
        }}
      >
        Add property
      </button>
    </div>
  );
}
