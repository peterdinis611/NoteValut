import type { Block } from "./blocks";
import { createBlock } from "./blocks";
import { getCustomTemplate, loadCustomTemplates } from "@/db/templates-collection";

export type PageTemplate = {
  id: string;
  name: string;
  icon: string;
  description: string;
  tags: string[];
  blocks: Block[];
};

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "blank",
    name: "Blank entry",
    icon: "📝",
    description: "Start from scratch",
    tags: [],
    blocks: [createBlock("paragraph", "")],
  },
  {
    id: "meeting",
    name: "Meeting notes",
    icon: "🤝",
    description: "Agenda, notes, and action items",
    tags: ["meeting"],
    blocks: [
      createBlock("heading2", "Attendees"),
      createBlock("bullet", ""),
      createBlock("heading2", "Agenda"),
      createBlock("bullet", ""),
      createBlock("heading2", "Notes"),
      createBlock("paragraph", ""),
      createBlock("heading2", "Action items"),
      createBlock("todo", "", { checked: false }),
      createBlock("todo", "", { checked: false }),
    ],
  },
  {
    id: "standup",
    name: "Daily standup",
    icon: "☀️",
    description: "Yesterday, today, blockers",
    tags: ["standup", "team"],
    blocks: [
      createBlock("heading2", "Yesterday"),
      createBlock("bullet", ""),
      createBlock("heading2", "Today"),
      createBlock("bullet", ""),
      createBlock("heading2", "Blockers"),
      createBlock("callout", "Anything stuck?", { calloutVariant: "warning" }),
      createBlock("todo", "", { checked: false }),
    ],
  },
  {
    id: "journal",
    name: "Daily journal",
    icon: "📔",
    description: "Reflect on your day",
    tags: ["journal"],
    blocks: [
      createBlock("callout", "What went well today?", { calloutVariant: "tip" }),
      createBlock("paragraph", ""),
      createBlock("callout", "What could be better?", { calloutVariant: "info" }),
      createBlock("paragraph", ""),
      createBlock("heading3", "Grateful for"),
      createBlock("bullet", ""),
      createBlock("bullet", ""),
    ],
  },
  {
    id: "weekly-review",
    name: "Weekly review",
    icon: "📅",
    description: "Wins, lessons, next week focus",
    tags: ["review", "planning"],
    blocks: [
      createBlock("heading2", "Wins"),
      createBlock("bullet", ""),
      createBlock("heading2", "Lessons"),
      createBlock("bullet", ""),
      createBlock("heading2", "Still open"),
      createBlock("todo", "", { checked: false }),
      createBlock("heading2", "Focus next week"),
      createBlock("paragraph", ""),
    ],
  },
  {
    id: "project",
    name: "Project brief",
    icon: "🎯",
    description: "Goals, scope, and milestones",
    tags: ["project"],
    blocks: [
      createBlock("heading2", "Overview"),
      createBlock("paragraph", ""),
      createBlock("heading2", "Goals"),
      createBlock("todo", "", { checked: false }),
      createBlock("todo", "", { checked: false }),
      createBlock("heading2", "Out of scope"),
      createBlock("bullet", ""),
      createBlock("heading2", "Milestones"),
      createBlock("bullet", ""),
    ],
  },
  {
    id: "decision",
    name: "Decision log",
    icon: "⚖️",
    description: "Context, options, and decision",
    tags: ["decision"],
    blocks: [
      createBlock("heading2", "Context"),
      createBlock("paragraph", ""),
      createBlock("heading2", "Options considered"),
      createBlock("bullet", ""),
      createBlock("bullet", ""),
      createBlock("heading2", "Decision"),
      createBlock("callout", "We decided to…", { calloutVariant: "info" }),
      createBlock("heading2", "Follow-ups"),
      createBlock("todo", "", { checked: false }),
    ],
  },
  {
    id: "brainstorm",
    name: "Brainstorm",
    icon: "💡",
    description: "Capture ideas without filtering",
    tags: ["ideas"],
    blocks: [
      createBlock("heading2", "Prompt"),
      createBlock("paragraph", ""),
      createBlock("heading2", "Ideas"),
      createBlock("bullet", ""),
      createBlock("bullet", ""),
      createBlock("bullet", ""),
      createBlock("heading2", "Top picks"),
      createBlock("todo", "", { checked: false }),
    ],
  },
  {
    id: "checklist",
    name: "Checklist",
    icon: "✅",
    description: "Simple task list",
    tags: ["tasks"],
    blocks: [
      createBlock("todo", "", { checked: false }),
      createBlock("todo", "", { checked: false }),
      createBlock("todo", "", { checked: false }),
      createBlock("todo", "", { checked: false }),
      createBlock("todo", "", { checked: false }),
    ],
  },
  {
    id: "howto",
    name: "How-to guide",
    icon: "📘",
    description: "Steps, tips, and pitfalls",
    tags: ["docs", "howto"],
    blocks: [
      createBlock("heading2", "Goal"),
      createBlock("paragraph", ""),
      createBlock("heading2", "Steps"),
      createBlock("numbered", ""),
      createBlock("numbered", ""),
      createBlock("numbered", ""),
      createBlock("callout", "Tip: add screenshots or links here.", { calloutVariant: "tip" }),
      createBlock("heading2", "Common pitfalls"),
      createBlock("bullet", ""),
    ],
  },
  {
    id: "reading",
    name: "Reading notes",
    icon: "📖",
    description: "Key takeaways from a book or article",
    tags: ["reading"],
    blocks: [
      createBlock("heading2", "Source"),
      createBlock("paragraph", "Title · Author"),
      createBlock("heading2", "Key takeaways"),
      createBlock("bullet", ""),
      createBlock("bullet", ""),
      createBlock("heading2", "Quotes"),
      createBlock("quote", ""),
      createBlock("heading2", "Actions"),
      createBlock("todo", "", { checked: false }),
    ],
  },
  {
    id: "bug-report",
    name: "Bug report",
    icon: "🐛",
    description: "Repro steps, expected vs actual",
    tags: ["bug", "engineering"],
    blocks: [
      createBlock("heading2", "Summary"),
      createBlock("paragraph", ""),
      createBlock("heading2", "Steps to reproduce"),
      createBlock("numbered", ""),
      createBlock("numbered", ""),
      createBlock("heading2", "Expected"),
      createBlock("paragraph", ""),
      createBlock("heading2", "Actual"),
      createBlock("callout", "What actually happened", { calloutVariant: "warning" }),
      createBlock("heading2", "Notes"),
      createBlock("paragraph", ""),
    ],
  },
];

/** Built-in templates excluding blank (for pickers / settings). */
export function listDefaultTemplates(): PageTemplate[] {
  return PAGE_TEMPLATES.filter((t) => t.id !== "blank");
}

export function getTemplate(id: string): PageTemplate {
  const builtin = PAGE_TEMPLATES.find((t) => t.id === id);
  if (builtin) return builtin;
  const custom = getCustomTemplate(id);
  if (custom) return custom;
  return PAGE_TEMPLATES[0];
}

/** Built-in + user templates (client-only for customs). */
export function listAllTemplates(): PageTemplate[] {
  return [...loadCustomTemplates(), ...PAGE_TEMPLATES];
}
