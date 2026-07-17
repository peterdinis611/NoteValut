export const LABEL_COLORS = [
  { id: "violet", class: "label-violet", hex: "#8b5cf6" },
  { id: "teal", class: "label-teal", hex: "#14b8a6" },
  { id: "amber", class: "label-amber", hex: "#f59e0b" },
  { id: "rose", class: "label-rose", hex: "#f43f5e" },
  { id: "sky", class: "label-sky", hex: "#0ea5e9" },
  { id: "lime", class: "label-lime", hex: "#84cc16" },
] as const;

export type LabelColorId = (typeof LABEL_COLORS)[number]["id"];

export function getLabelColor(id?: string) {
  return LABEL_COLORS.find((c) => c.id === id) ?? LABEL_COLORS[0];
}
