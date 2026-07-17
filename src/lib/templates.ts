import type { Block } from "./blocks";
import { createBlock } from "./blocks";

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
      createBlock("heading2", "Milestones"),
      createBlock("bullet", ""),
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
    ],
  },
];

export function getTemplate(id: string) {
  return PAGE_TEMPLATES.find((t) => t.id === id) ?? PAGE_TEMPLATES[0];
}
