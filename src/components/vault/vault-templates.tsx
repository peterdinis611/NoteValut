"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  CheckSquare,
  Copy,
  FilePlus2,
  FileText,
  LayoutTemplate,
  ListTodo,
  NotebookPen,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { plainTextFromEditorContent } from "@/lib/editor/content";
import {
  deleteCustomTemplate,
  duplicateAsCustomTemplate,
  listPageTemplates,
  PAGE_TEMPLATES,
  saveCustomTemplate,
  updateCustomTemplate,
  type PageTemplate,
} from "@/lib/vault/page-templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";
import { NotionEditor } from "./editor/notion-editor";
import { ScrollPane } from "./scroll-to-top";

type Draft = {
  label: string;
  description: string;
  suggestedTitle: string;
  tagsText: string;
  body: string;
};

type PanelMode =
  | { kind: "view" }
  | { kind: "create"; draft: Draft }
  | { kind: "edit"; id: string; draft: Draft };

type CatalogFilter = "all" | "builtin" | "yours";

const emptyDraft = (): Draft => ({
  label: "",
  description: "",
  suggestedTitle: "",
  tagsText: "custom",
  body: "<h2></h2><p></p>",
});

const draftFromTemplate = (template: PageTemplate): Draft => ({
  label: template.label,
  description: template.description,
  suggestedTitle: template.suggestedTitle,
  tagsText: template.tags.join(", "),
  body: template.body || "<p></p>",
});

const parseTags = (value: string) =>
  value
    .split(/[,#]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);

const templateIcon = (template: PageTemplate) => {
  if (template.custom) return NotebookPen;
  switch (template.id) {
    case "meeting":
      return Users;
    case "daily":
      return NotebookPen;
    case "brief":
      return FileText;
    case "checklist":
      return CheckSquare;
    case "wiki":
      return LayoutTemplate;
    case "blank":
      return FilePlus2;
    default:
      return ListTodo;
  }
};

const previewLines = (body: string) => {
  const text = plainTextFromEditorContent(body).trim();
  if (!text) return [] as string[];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);
};

export function VaultTemplates({
  onUseTemplate,
}: {
  onUseTemplate: (templateId: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [catalog, setCatalog] = useState<PageTemplate[]>([...PAGE_TEMPLATES]);
  const [selectedId, setSelectedId] = useState<string>("blank");
  const [mode, setMode] = useState<PanelMode>({ kind: "view" });
  const [filter, setFilter] = useState<CatalogFilter>("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => setCatalog(listPageTemplates());

  useEffect(() => {
    refresh();
  }, []);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 1800);
  };

  const selected =
    catalog.find((template) => template.id === selectedId) ?? catalog[0]!;

  const builtins = useMemo(
    () => catalog.filter((template) => !template.custom),
    [catalog],
  );
  const customs = useMemo(
    () => catalog.filter((template) => template.custom),
    [catalog],
  );

  const visible = useMemo(() => {
    const base =
      filter === "builtin"
        ? builtins
        : filter === "yours"
          ? customs
          : catalog;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (template) =>
        template.label.toLowerCase().includes(q) ||
        template.description.toLowerCase().includes(q) ||
        template.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [builtins, catalog, customs, filter, query]);

  const editing = mode.kind === "create" || mode.kind === "edit";
  const lines = previewLines(selected?.body ?? "");

  const startCreate = () => {
    setError(null);
    setFilter("yours");
    setMode({ kind: "create", draft: emptyDraft() });
  };

  const startEdit = (template: PageTemplate) => {
    if (!template.custom) return;
    setError(null);
    setSelectedId(template.id);
    setMode({
      kind: "edit",
      id: template.id,
      draft: draftFromTemplate(template),
    });
  };

  const cancelEdit = () => {
    setError(null);
    setMode({ kind: "view" });
  };

  const patchDraft = (patch: Partial<Draft>) => {
    setMode((current) => {
      if (current.kind === "view") return current;
      return { ...current, draft: { ...current.draft, ...patch } };
    });
  };

  const saveDraft = () => {
    if (mode.kind === "view") return;
    const { draft } = mode;
    const label = draft.label.trim();
    if (!label) {
      setError("Name is required.");
      return;
    }

    try {
      if (mode.kind === "create") {
        const created = saveCustomTemplate({
          label,
          description: draft.description,
          suggestedTitle: draft.suggestedTitle.trim() || label,
          tags: parseTags(draft.tagsText),
          body: draft.body,
        });
        refresh();
        setSelectedId(created.id);
        setFilter("yours");
        setMode({ kind: "view" });
        flash("Template created");
        return;
      }

      const updated = updateCustomTemplate(mode.id, {
        label,
        description: draft.description,
        suggestedTitle: draft.suggestedTitle.trim() || label,
        tags: parseTags(draft.tagsText),
        body: draft.body,
      });
      if (!updated) {
        setError("Could not update template.");
        return;
      }
      refresh();
      setSelectedId(updated.id);
      setMode({ kind: "view" });
      flash("Template saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save template.");
    }
  };

  const remove = () => {
    if (!selected?.custom) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Delete template “${selected.label}”?`)
    ) {
      return;
    }
    deleteCustomTemplate(selected.id);
    refresh();
    setSelectedId("blank");
    setMode({ kind: "view" });
    flash("Template deleted");
  };

  const duplicate = () => {
    try {
      const copy = duplicateAsCustomTemplate(selected.id);
      refresh();
      setSelectedId(copy.id);
      setFilter("yours");
      setMode({ kind: "edit", id: copy.id, draft: draftFromTemplate(copy) });
      flash("Editable copy ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not duplicate");
    }
  };

  useEffect(() => {
    if (editing) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        onUseTemplate(selected.id);
      } else if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        setError(null);
        setFilter("yours");
        setMode({ kind: "create", draft: emptyDraft() });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, onUseTemplate, selected.id]);

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-0 flex min-w-0 flex-1 flex-col overflow-hidden bg-background"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-55"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 42% 34% at 92% 0%, color-mix(in oklch, var(--primary) 16%, transparent), transparent 58%)",
        }}
      />

      <header className="relative z-10 border-b border-border px-5 py-5 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Starters
            </p>
            <h1 className="mt-1 font-display text-[2rem] leading-none font-semibold tracking-tight md:text-[2.35rem]">
              Templates
            </h1>
            <p className="mt-2 max-w-lg text-[13px] text-muted-foreground">
              Browse, search, and shape page skeletons.{" "}
              <kbd className="rounded border border-border px-1 font-mono text-[10px]">
                Enter
              </kbd>{" "}
              uses the selection ·{" "}
              <kbd className="rounded border border-border px-1 font-mono text-[10px]">
                N
              </kbd>{" "}
              new
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {message ? (
              <Badge variant="secondary" className="rounded-md">
                {message}
              </Badge>
            ) : null}
            <Button
              type="button"
              className="rounded-xl"
              onClick={startCreate}
              disabled={editing}
            >
              <Plus data-icon="inline-start" />
              New template
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label
            className={cn(
              "flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-input bg-transparent px-3 dark:bg-input/30",
              editing && "pointer-events-none opacity-50",
            )}
          >
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search templates…"
              disabled={editing}
              className="h-full w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            />
          </label>
          <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
            {(
              [
                ["all", `All ${catalog.length}`],
                ["builtin", `Built-in ${builtins.length}`],
                ["yours", `Yours ${customs.length}`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                disabled={editing}
                onClick={() => setFilter(id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-40",
                  filter === id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <ScrollPane className="relative z-10 px-5 py-5 md:px-8">
        <div
          className={cn(
            "mx-auto grid max-w-6xl gap-5",
            editing
              ? "lg:grid-cols-1"
              : "lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]",
          )}
        >
          {!editing ? (
          <div className="space-y-2">
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  {filter === "yours"
                    ? "No custom templates yet."
                    : "No templates match that search."}
                </p>
                {filter === "yours" ? (
                  <Button
                    type="button"
                    className="mt-4 rounded-xl"
                    onClick={startCreate}
                  >
                    <Plus data-icon="inline-start" />
                    Create your first
                  </Button>
                ) : null}
              </div>
            ) : (
              visible.map((template, index) => {
                const Icon = templateIcon(template);
                const active = template.id === selectedId && !editing;
                return (
                  <motion.button
                    key={template.id}
                    type="button"
                    disabled={editing}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: reduceMotion ? 0 : Math.min(index * 0.02, 0.16),
                    }}
                    onClick={() => setSelectedId(template.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors disabled:opacity-50",
                      active
                        ? "border-primary/40 bg-accent"
                        : "border-border bg-card/70 hover:bg-muted/50",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/80",
                        active ? "bg-background" : "bg-muted/40",
                      )}
                    >
                      <Icon className="size-4 stroke-[1.5]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[14px] font-medium tracking-tight">
                          {template.label}
                        </span>
                        {template.custom ? (
                          <Badge
                            variant="outline"
                            className="rounded-md px-1.5 py-0 text-[9px]"
                          >
                            Yours
                          </Badge>
                        ) : null}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-[12px] leading-snug text-muted-foreground">
                        {template.description}
                      </span>
                    </span>
                  </motion.button>
                );
              })
            )}
          </div>
          ) : null}

          <div
            className={cn(
              "rounded-2xl border border-border bg-card",
              !editing && "lg:sticky lg:top-3 lg:self-start",
              editing && "mx-auto w-full max-w-3xl overflow-hidden",
            )}
          >
            {editing ? (
              <TemplateEditorForm
                title={
                  mode.kind === "create" ? "New template" : "Edit template"
                }
                draft={mode.draft}
                editorKey={
                  mode.kind === "create"
                    ? "template-new"
                    : `template-${mode.id}`
                }
                error={error}
                onChange={patchDraft}
                onSave={saveDraft}
                onCancel={cancelEdit}
              />
            ) : (
              <>
                <div className="border-b border-border px-5 py-5">
                  <div className="flex items-start gap-3">
                    {(() => {
                      const Icon = templateIcon(selected);
                      return (
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/40">
                          <Icon className="size-5 stroke-[1.5]" />
                        </span>
                      );
                    })()}
                    <div className="min-w-0">
                      <h2 className="font-display text-2xl font-semibold tracking-tight">
                        {selected.label}
                      </h2>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {selected.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {selected.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="rounded-md text-[10px]"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                    Structure
                  </p>
                  {lines.length === 0 ? (
                    <p className="mt-3 text-[13px] text-muted-foreground">
                      Empty page — a clean slate.
                    </p>
                  ) : (
                    <ol className="mt-3 space-y-2">
                      {lines.map((line, index) => (
                        <li
                          key={`${index}-${line}`}
                          className="flex gap-3 text-[13px] leading-snug"
                        >
                          <span className="w-4 shrink-0 font-mono text-[10px] text-muted-foreground tabular-nums">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-foreground/85">{line}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  <p className="mt-4 text-[12px] text-muted-foreground">
                    Suggested title:{" "}
                    <span className="text-foreground">
                      {selected.suggestedTitle}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
                  <Button
                    type="button"
                    className="rounded-xl"
                    onClick={() => onUseTemplate(selected.id)}
                  >
                    <FilePlus2 data-icon="inline-start" />
                    Use template
                  </Button>
                  {selected.custom ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => startEdit(selected)}
                      >
                        <Pencil data-icon="inline-start" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={duplicate}
                      >
                        <Copy data-icon="inline-start" />
                        Duplicate
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="rounded-xl"
                        onClick={remove}
                      >
                        <Trash2 data-icon="inline-start" />
                        Delete
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={duplicate}
                    >
                      <Pencil data-icon="inline-start" />
                      Customize
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </ScrollPane>
    </motion.section>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-foreground">
          {label}
        </label>
        {hint ? (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function TemplateEditorForm({
  title,
  draft,
  editorKey,
  error,
  onChange,
  onSave,
  onCancel,
}: {
  title: string;
  draft: Draft;
  editorKey: string;
  error: string | null;
  onChange: (patch: Partial<Draft>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Template editor
          </p>
          <h2 className="mt-0.5 font-display text-[1.45rem] font-semibold tracking-tight">
            {title}
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Name it, describe it, then shape the page body below.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close editor"
          onClick={onCancel}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="space-y-5 px-5 py-5">
        <section className="space-y-4">
          <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Details
          </p>
          <Field id="template-name" label="Name" hint="Required">
            <Input
              id="template-name"
              autoFocus
              value={draft.label}
              onChange={(event) => onChange({ label: event.target.value })}
              className="h-10 rounded-xl"
              placeholder="e.g. Weekly review"
            />
          </Field>
          <Field
            id="template-description"
            label="Description"
            hint="Shown in the picker"
          >
            <Textarea
              id="template-description"
              value={draft.description}
              onChange={(event) => onChange({ description: event.target.value })}
              className="min-h-[5.5rem] resize-y rounded-xl"
              placeholder="What is this template for?"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="template-suggested-title"
              label="Suggested page title"
              hint="Prefill on create"
            >
              <Input
                id="template-suggested-title"
                value={draft.suggestedTitle}
                onChange={(event) =>
                  onChange({ suggestedTitle: event.target.value })
                }
                className="h-10 rounded-xl"
                placeholder="Untitled"
              />
            </Field>
            <Field
              id="template-tags"
              label="Tags"
              hint="Comma-separated"
            >
              <Input
                id="template-tags"
                value={draft.tagsText}
                onChange={(event) => onChange({ tagsText: event.target.value })}
                className="h-10 rounded-xl"
                placeholder="custom, work"
              />
            </Field>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              Page body
            </p>
            <span className="text-[11px] text-muted-foreground">
              Type / for blocks
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="border-b border-border bg-muted/30 px-3 py-2">
              <p className="text-[12px] text-muted-foreground">
                This content is inserted when someone uses the template.
              </p>
            </div>
            <div className="px-3 py-3">
              <NotionEditor
                noteId={editorKey}
                content={draft.body}
                className="min-h-[16rem]"
                onChange={(body) => onChange({ body })}
              />
            </div>
          </div>
        </section>

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-card/95 px-5 py-3 backdrop-blur-sm">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="rounded-xl"
          onClick={onSave}
          disabled={!draft.label.trim()}
        >
          Save template
        </Button>
      </div>
    </div>
  );
}
