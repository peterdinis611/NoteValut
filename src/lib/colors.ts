export const LABEL_COLORS = [
  { id: "violet", class: "label-violet", hex: "#6f4bb3" },
  { id: "indigo", class: "label-indigo", hex: "#4338ca" },
  { id: "blue", class: "label-blue", hex: "#1d4ed8" },
  { id: "sky", class: "label-sky", hex: "#0369a1" },
  { id: "cyan", class: "label-cyan", hex: "#0e7490" },
  { id: "teal", class: "label-teal", hex: "#0f766e" },
  { id: "emerald", class: "label-emerald", hex: "#047857" },
  { id: "lime", class: "label-lime", hex: "#4d7c0f" },
  { id: "amber", class: "label-amber", hex: "#b45309" },
  { id: "orange", class: "label-orange", hex: "#e8611a" },
  { id: "rose", class: "label-rose", hex: "#be123c" },
  { id: "pink", class: "label-pink", hex: "#be185d" },
  { id: "fuchsia", class: "label-fuchsia", hex: "#a21caf" },
  { id: "slate", class: "label-slate", hex: "#6d6458" },
] as const;

export type LabelColorId = (typeof LABEL_COLORS)[number]["id"];

/** Editor block text accents. */
export const TEXT_COLORS = [
  { id: "default", label: "Default", hex: "" },
  { id: "white", label: "Paper", hex: "#6d6458" },
  { id: "slate", label: "Slate", hex: "#4a433c" },
  { id: "red", label: "Red", hex: "#b42318" },
  { id: "rose", label: "Rose", hex: "#be123c" },
  { id: "orange", label: "Brew", hex: "#e8611a" },
  { id: "amber", label: "Amber", hex: "#b45309" },
  { id: "yellow", label: "Gold", hex: "#a16207" },
  { id: "lime", label: "Olive", hex: "#4d7c0f" },
  { id: "green", label: "Green", hex: "#047857" },
  { id: "emerald", label: "Emerald", hex: "#0f766e" },
  { id: "teal", label: "Teal", hex: "#0e7490" },
  { id: "cyan", label: "Cyan", hex: "#155e75" },
  { id: "sky", label: "Sky", hex: "#0369a1" },
  { id: "blue", label: "Blue", hex: "#1d4ed8" },
  { id: "indigo", label: "Indigo", hex: "#4338ca" },
  { id: "violet", label: "Violet", hex: "#6d28d9" },
  { id: "purple", label: "Lilac", hex: "#6f4bb3" },
  { id: "fuchsia", label: "Fuchsia", hex: "#a21caf" },
  { id: "pink", label: "Pink", hex: "#be185d" },
] as const;

export type TextColorId = (typeof TEXT_COLORS)[number]["id"];

/** Soft block background highlights. */
export const HIGHLIGHT_COLORS = [
  { id: "none", label: "None", hex: "" },
  { id: "red", label: "Red", hex: "rgba(196, 60, 26, 0.16)" },
  { id: "orange", label: "Brew", hex: "rgba(232, 97, 26, 0.16)" },
  { id: "amber", label: "Amber", hex: "rgba(180, 83, 9, 0.14)" },
  { id: "lime", label: "Olive", hex: "rgba(77, 124, 15, 0.14)" },
  { id: "green", label: "Green", hex: "rgba(4, 120, 87, 0.14)" },
  { id: "teal", label: "Teal", hex: "rgba(14, 116, 144, 0.14)" },
  { id: "sky", label: "Sky", hex: "rgba(3, 105, 161, 0.14)" },
  { id: "blue", label: "Blue", hex: "rgba(29, 78, 216, 0.12)" },
  { id: "violet", label: "Lilac", hex: "rgba(203, 182, 238, 0.45)" },
  { id: "pink", label: "Pink", hex: "rgba(190, 24, 93, 0.12)" },
  { id: "slate", label: "Ink", hex: "rgba(23, 20, 18, 0.08)" },
] as const;

export type HighlightColorId = (typeof HIGHLIGHT_COLORS)[number]["id"];

export function getLabelColor(id?: string) {
  return LABEL_COLORS.find((c) => c.id === id) ?? LABEL_COLORS[0];
}

export function getTextColor(id?: string | null) {
  if (!id || id === "default") return null;
  return TEXT_COLORS.find((c) => c.id === id) ?? null;
}

export function getHighlightColor(id?: string | null) {
  if (!id || id === "none") return null;
  return HIGHLIGHT_COLORS.find((c) => c.id === id) ?? null;
}

export function textColorStyle(id?: string | null): { color?: string } {
  const c = getTextColor(id);
  return c?.hex ? { color: c.hex } : {};
}

export function blockToneStyle(
  color?: string | null,
  bgColor?: string | null,
): { color?: string; backgroundColor?: string; borderRadius?: string; padding?: string } {
  const text = getTextColor(color);
  const bg = getHighlightColor(bgColor);
  return {
    ...(text?.hex ? { color: text.hex } : {}),
    ...(bg?.hex
      ? {
          backgroundColor: bg.hex,
          borderRadius: "0.4rem",
          padding: "0.15rem 0.4rem",
        }
      : {}),
  };
}
