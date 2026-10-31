import { sanitizeEditorHtml } from "@/lib/editor/sanitize";

export type BuiltinPageTemplateId =
  | "blank"
  | "meeting"
  | "daily"
  | "brief"
  | "checklist"
  | "wiki";

/** Built-in id or `custom:<uuid>` for user templates. */
export type PageTemplateId = BuiltinPageTemplateId | (string & {});

export type PageTemplate = {
  id: PageTemplateId;
  label: string;
  description: string;
  /** Suggested title when the field is still the default */
  suggestedTitle: string;
  tags: string[];
  /** TipTap-ready HTML skeleton */
  body: string;
  /** User-created template stored in localStorage */
  custom?: boolean;
};

const CUSTOM_STORAGE_KEY = "notevalut.vault.custom-templates";
const MAX_CUSTOM_TEMPLATES = 24;
const MAX_CUSTOM_BODY = 50_000;

function taskItem(label: string) {
  return [
    '<li data-type="taskItem" data-checked="false">',
    '<label><input type="checkbox"><span></span></label>',
    `<div><p>${label}</p></div>`,
    "</li>",
  ].join("");
}

function taskList(labels: string[]) {
  return `<ul data-type="taskList">${labels.map(taskItem).join("")}</ul>`;
}

export const PAGE_TEMPLATES: readonly PageTemplate[] = [
  {
    id: "blank",
    label: "Blank",
    description: "Empty page — start from scratch.",
    suggestedTitle: "Untitled",
    tags: ["inbox"],
    body: "",
  },
  {
    id: "meeting",
    label: "Meeting",
    description: "Agenda, notes, and action items.",
    suggestedTitle: "Meeting notes",
    tags: ["meeting"],
    body: [
      "<h2>Agenda</h2>",
      "<ul><li><p>Topic</p></li><li><p>Topic</p></li><li><p>Topic</p></li></ul>",
      "<h2>Notes</h2>",
      "<p></p>",
      "<h2>Action items</h2>",
      taskList(["Follow up", "Assign owner"]),
    ].join(""),
  },
  {
    id: "daily",
    label: "Daily",
    description: "Focus, wins, and tomorrow.",
    suggestedTitle: "Daily journal",
    tags: ["daily"],
    body: [
      "<h2>Today’s focus</h2>",
      "<p></p>",
      "<h2>What happened</h2>",
      "<ul><li><p></p></li><li><p></p></li></ul>",
      "<h2>Wins</h2>",
      "<ul><li><p></p></li></ul>",
      "<h2>Tomorrow</h2>",
      taskList(["First move"]),
    ].join(""),
  },
  {
    id: "brief",
    label: "Brief",
    description: "Goal, context, and next step.",
    suggestedTitle: "Project brief",
    tags: ["brief"],
    body: [
      "<h2>Goal</h2>",
      "<p></p>",
      "<h2>Context</h2>",
      "<p></p>",
      "<h2>Constraints</h2>",
      "<ul><li><p></p></li><li><p></p></li></ul>",
      "<h2>Success looks like</h2>",
      "<p></p>",
      "<h2>Next step</h2>",
      "<p></p>",
    ].join(""),
  },
  {
    id: "checklist",
    label: "Checklist",
    description: "A clean task list ready to tick.",
    suggestedTitle: "Checklist",
    tags: ["tasks"],
    body: ["<h2>To do</h2>", taskList(["One", "Two", "Three", "Four"])].join(
      "",
    ),
  },
  {
    id: "wiki",
    label: "Wiki",
    description: "Summary, details, and related links.",
    suggestedTitle: "Wiki page",
    tags: ["wiki"],
    body: [
      "<h2>Summary</h2>",
      "<p></p>",
      "<h2>Details</h2>",
      "<p></p>",
      "<h2>Related</h2>",
      "<ul><li><p></p></li><li><p></p></li></ul>",
    ].join(""),
  },
];

function isCustomTemplateId(id: string) {
  return id.startsWith("custom:");
}

function normalizeCustom(raw: unknown): PageTemplate | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : "";
  const label = typeof row.label === "string" ? row.label.trim() : "";
  if (!isCustomTemplateId(id) || !label) return null;

  const description =
    typeof row.description === "string" && row.description.trim()
      ? row.description.trim().slice(0, 120)
      : "Your custom template";
  const suggestedTitle =
    typeof row.suggestedTitle === "string" && row.suggestedTitle.trim()
      ? row.suggestedTitle.trim().slice(0, 120)
      : label;
  const tags = Array.isArray(row.tags)
    ? row.tags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim().slice(0, 24))
        .filter(Boolean)
        .slice(0, 8)
    : ["custom"];
  const body =
    typeof row.body === "string"
      ? sanitizeEditorHtml(row.body.slice(0, MAX_CUSTOM_BODY))
      : "";

  return {
    id,
    label: label.slice(0, 60),
    description,
    suggestedTitle,
    tags: tags.length ? tags : ["custom"],
    body,
    custom: true,
  };
}

export function loadCustomTemplates(): PageTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeCustom)
      .filter((row): row is PageTemplate => row != null)
      .slice(0, MAX_CUSTOM_TEMPLATES);
  } catch {
    return [];
  }
}

function persistCustomTemplates(templates: PageTemplate[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CUSTOM_STORAGE_KEY,
    JSON.stringify(
      templates.slice(0, MAX_CUSTOM_TEMPLATES).map((template) => ({
        id: template.id,
        label: template.label,
        description: template.description,
        suggestedTitle: template.suggestedTitle,
        tags: template.tags,
        body: template.body.slice(0, MAX_CUSTOM_BODY),
        custom: true,
      })),
    ),
  );
}

export function listPageTemplates(): PageTemplate[] {
  return [...PAGE_TEMPLATES, ...loadCustomTemplates()];
}

export function getPageTemplate(id: PageTemplateId | string | undefined) {
  if (!id) return PAGE_TEMPLATES[0]!;
  const builtin = PAGE_TEMPLATES.find((template) => template.id === id);
  if (builtin) return builtin;
  const custom = loadCustomTemplates().find((template) => template.id === id);
  return custom ?? PAGE_TEMPLATES[0]!;
}

export function saveCustomTemplate(input: {
  label: string;
  description?: string;
  suggestedTitle?: string;
  tags?: string[];
  body: string;
}): PageTemplate {
  const label = input.label.trim().slice(0, 60);
  if (!label) {
    throw new Error("Template name is required.");
  }

  const existing = loadCustomTemplates();
  if (existing.length >= MAX_CUSTOM_TEMPLATES) {
    throw new Error(`You can keep up to ${MAX_CUSTOM_TEMPLATES} custom templates.`);
  }

  const template: PageTemplate = {
    id: `custom:${crypto.randomUUID()}`,
    label,
    description: (input.description?.trim() || "Your custom template").slice(
      0,
      120,
    ),
    suggestedTitle: (input.suggestedTitle?.trim() || label).slice(0, 120),
    tags: (input.tags?.length ? input.tags : ["custom"])
      .map((tag) => tag.trim().slice(0, 24))
      .filter(Boolean)
      .slice(0, 8),
    body: sanitizeEditorHtml(input.body.slice(0, MAX_CUSTOM_BODY)),
    custom: true,
  };

  persistCustomTemplates([template, ...existing]);
  return template;
}

export function deleteCustomTemplate(id: string) {
  if (!isCustomTemplateId(id)) return;
  persistCustomTemplates(
    loadCustomTemplates().filter((template) => template.id !== id),
  );
}

export function updateCustomTemplate(
  id: string,
  patch: Partial<
    Pick<PageTemplate, "label" | "description" | "suggestedTitle" | "tags" | "body">
  >,
): PageTemplate | null {
  if (!isCustomTemplateId(id)) return null;
  const existing = loadCustomTemplates();
  const index = existing.findIndex((template) => template.id === id);
  if (index < 0) return null;

  const current = existing[index]!;
  const next: PageTemplate = {
    ...current,
    label: patch.label?.trim()
      ? patch.label.trim().slice(0, 60)
      : current.label,
    description: patch.description?.trim()
      ? patch.description.trim().slice(0, 120)
      : current.description,
    suggestedTitle: patch.suggestedTitle?.trim()
      ? patch.suggestedTitle.trim().slice(0, 120)
      : current.suggestedTitle,
    tags: patch.tags
      ? patch.tags
          .map((tag) => tag.trim().slice(0, 24))
          .filter(Boolean)
          .slice(0, 8)
      : current.tags,
    body:
      patch.body != null
        ? sanitizeEditorHtml(patch.body.slice(0, MAX_CUSTOM_BODY))
        : current.body,
    custom: true,
  };

  const list = [...existing];
  list[index] = next;
  persistCustomTemplates(list);
  return next;
}

export function duplicateAsCustomTemplate(
  sourceId: string,
  label?: string,
): PageTemplate {
  const source = getPageTemplate(sourceId);
  return saveCustomTemplate({
    label: label?.trim() || `${source.label} copy`,
    description: source.description,
    suggestedTitle: source.suggestedTitle,
    tags: [...source.tags],
    body: source.body,
  });
}
