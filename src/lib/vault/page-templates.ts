export type PageTemplateId =
  | "blank"
  | "meeting"
  | "daily"
  | "brief"
  | "checklist"
  | "wiki";

export type PageTemplate = {
  id: PageTemplateId;
  label: string;
  description: string;
  /** Suggested title when the field is still the default */
  suggestedTitle: string;
  tags: string[];
  /** TipTap-ready HTML skeleton */
  body: string;
};

function taskItem(label: string) {
  return [
    '<li data-type="taskItem" data-checked="false">',
    "<label><input type=\"checkbox\"><span></span></label>",
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
] as const;

export function getPageTemplate(id: PageTemplateId | string | undefined) {
  return (
    PAGE_TEMPLATES.find((template) => template.id === id) ?? PAGE_TEMPLATES[0]
  );
}
