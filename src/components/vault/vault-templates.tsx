"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  Copy,
  FilePlus2,
  LayoutTemplate,
  Pencil,
  Plus,
  Trash2,
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

export function VaultTemplates({
  onUseTemplate,
}: {
  onUseTemplate: (templateId: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [catalog, setCatalog] = useState<PageTemplate[]>([...PAGE_TEMPLATES]);
  const [selectedId, setSelectedId] = useState<string>("blank");
  const [mode, setMode] = useState<PanelMode>({ kind: "view" });
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

  const previewText = plainTextFromEditorContent(selected?.body ?? "").trim();
  const editing = mode.kind === "create" || mode.kind === "edit";

  const startCreate = () => {
    setError(null);
    setMode({ kind: "create", draft: emptyDraft() });
  };

  const startEdit = (template: PageTemplate) => {
    if (!template.custom) return;
    setError(null);
    setSelectedId(template.id);
    setMode({ kind: "edit", id: template.id, draft: draftFromTemplate(template) });
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
      setMode({ kind: "edit", id: copy.id, draft: draftFromTemplate(copy) });
      flash("Editable copy ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not duplicate");
    }
  };

  const customizeBuiltin = () => {
    if (selected.custom) {
      startEdit(selected);
      return;
    }
    duplicate();
  };

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-0 flex min-w-0 flex-1 flex-col overflow-hidden bg-background"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 45% 35% at 90% 0%, color-mix(in oklch, var(--primary) 14%, transparent), transparent 60%)",
        }}
      />

      <header className="relative z-10 border-b border-border px-6 py-5 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-foreground/55 uppercase">
              Page starters
            </p>
            <h1 className="mt-1 flex items-center gap-2.5 font-display text-3xl tracking-tight text-foreground md:text-4xl">
              <LayoutTemplate className="size-7 stroke-[1.5] text-foreground/70" />
              Templates
            </h1>
            <p className="mt-2 max-w-xl text-[14px] text-foreground/65">
              Create your own starters, edit custom ones, or customize a built-in
              into an editable copy.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {message ? (
              <Badge variant="secondary" className="rounded-lg">
                {message}
              </Badge>
            ) : null}
            <Badge variant="outline" className="rounded-lg font-mono text-[11px]">
              {customs.length} custom · {builtins.length} built-in
            </Badge>
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
      </header>

      <ScrollPane className="relative z-10 px-6 py-6 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-5">
            <TemplateGroup
              title="Built-in"
              templates={builtins}
              selectedId={selectedId}
              disabled={editing}
              onSelect={(id) => {
                if (editing) return;
                setSelectedId(id);
              }}
            />
            <TemplateGroup
              title="Yours"
              empty="No custom templates yet — create one, or duplicate a built-in."
              templates={customs}
              selectedId={selectedId}
              disabled={editing}
              onSelect={(id) => {
                if (editing) return;
                setSelectedId(id);
              }}
              onCreate={startCreate}
            />
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-[0_20px_50px_-40px_rgba(40,20,10,0.45)] backdrop-blur-sm dark:shadow-[0_20px_50px_-40px_rgba(0,0,0,0.65)]">
            {editing ? (
              <TemplateEditorForm
                title={mode.kind === "create" ? "New template" : "Edit template"}
                draft={mode.draft}
                editorKey={
                  mode.kind === "create" ? "template-new" : `template-${mode.id}`
                }
                error={error}
                onChange={patchDraft}
                onSave={saveDraft}
                onCancel={cancelEdit}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-semibold tracking-tight">
                      {selected.label}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selected.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {selected.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="rounded-md text-[11px]"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {selected.custom ? (
                        <Badge variant="outline" className="rounded-md text-[11px]">
                          Custom
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-md text-[11px]">
                          Built-in
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-border bg-muted/25 p-4">
                  <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                    Preview
                  </p>
                  <p className="mt-2 whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-foreground/80">
                    {previewText || "(empty page)"}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
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
                      onClick={customizeBuiltin}
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          {title}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Cancel"
          onClick={onCancel}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <Input
          autoFocus
          value={draft.label}
          onChange={(event) => onChange({ label: event.target.value })}
          className="h-10 rounded-xl font-display text-lg font-semibold"
          placeholder="Template name"
        />
        <Textarea
          value={draft.description}
          onChange={(event) => onChange({ description: event.target.value })}
          className="min-h-20 rounded-xl"
          placeholder="Short description shown in the picker"
        />
        <Input
          value={draft.suggestedTitle}
          onChange={(event) => onChange({ suggestedTitle: event.target.value })}
          className="h-10 rounded-xl"
          placeholder="Suggested page title"
        />
        <Input
          value={draft.tagsText}
          onChange={(event) => onChange({ tagsText: event.target.value })}
          className="h-10 rounded-xl"
          placeholder="Tags (comma-separated)"
        />
      </div>

      <div className="rounded-xl border border-border bg-background/80 p-3">
        <p className="mb-2 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          Body
        </p>
        <NotionEditor
          noteId={editorKey}
          content={draft.body}
          className="min-h-[12rem]"
          onChange={(body) => onChange({ body })}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="rounded-xl"
          onClick={onSave}
          disabled={!draft.label.trim()}
        >
          Save template
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function TemplateGroup({
  title,
  empty,
  templates,
  selectedId,
  disabled,
  onSelect,
  onCreate,
}: {
  title: string;
  empty?: string;
  templates: readonly PageTemplate[];
  selectedId: string;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onCreate?: () => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          {title}
        </p>
        {onCreate ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onCreate}
            className="text-[11px] font-medium text-primary hover:underline disabled:opacity-40"
          >
            + New
          </button>
        ) : null}
      </div>
      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          <p>{empty}</p>
          {onCreate ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 rounded-lg"
              disabled={disabled}
              onClick={onCreate}
            >
              <Plus data-icon="inline-start" />
              Create template
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {templates.map((template) => {
            const active = template.id === selectedId;
            return (
              <button
                key={template.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(template.id)}
                className={cn(
                  "rounded-xl border px-3.5 py-3 text-left transition-colors disabled:opacity-50",
                  active
                    ? "border-primary/45 bg-accent text-accent-foreground"
                    : "border-border bg-card/50 hover:bg-muted/60",
                )}
              >
                <span className="block text-sm font-medium tracking-tight">
                  {template.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                  {template.description}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
