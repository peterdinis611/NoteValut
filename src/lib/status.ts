/** Shared status presets for table + kanban views. */
export const STATUS_OPTIONS = ["", "Todo", "Doing", "Done", "Blocked"] as const;

export type NoteStatus = (typeof STATUS_OPTIONS)[number];

export const KANBAN_COLUMNS = [
  { id: "", label: "No status" },
  { id: "Todo", label: "Todo" },
  { id: "Doing", label: "Doing" },
  { id: "Done", label: "Done" },
  { id: "Blocked", label: "Blocked" },
] as const;
