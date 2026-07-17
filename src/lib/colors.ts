export const LABEL_COLORS = [
  { id: "violet", class: "label-violet", hex: "#8b5cf6" },
  { id: "indigo", class: "label-indigo", hex: "#6366f1" },
  { id: "blue", class: "label-blue", hex: "#3b82f6" },
  { id: "sky", class: "label-sky", hex: "#0ea5e9" },
  { id: "cyan", class: "label-cyan", hex: "#06b6d4" },
  { id: "teal", class: "label-teal", hex: "#14b8a6" },
  { id: "emerald", class: "label-emerald", hex: "#10b981" },
  { id: "lime", class: "label-lime", hex: "#84cc16" },
  { id: "amber", class: "label-amber", hex: "#f59e0b" },
  { id: "orange", class: "label-orange", hex: "#f97316" },
  { id: "rose", class: "label-rose", hex: "#f43f5e" },
  { id: "pink", class: "label-pink", hex: "#ec4899" },
  { id: "fuchsia", class: "label-fuchsia", hex: "#d946ef" },
  { id: "slate", class: "label-slate", hex: "#94a3b8" },
] as const;

export type LabelColorId = (typeof LABEL_COLORS)[number]["id"];

/** Soft text accents for editor blocks (readable on dark navy). */
export const TEXT_COLORS = [
  { id: "default", label: "Default", hex: "" },
  { id: "white", label: "White", hex: "#f8fafc" },
  { id: "slate", label: "Slate", hex: "#94a3b8" },
  { id: "red", label: "Red", hex: "#fca5a5" },
  { id: "rose", label: "Rose", hex: "#fda4af" },
  { id: "orange", label: "Orange", hex: "#fdba74" },
  { id: "amber", label: "Amber", hex: "#fcd34d" },
  { id: "yellow", label: "Yellow", hex: "#fde047" },
  { id: "lime", label: "Lime", hex: "#bef264" },
  { id: "green", label: "Green", hex: "#86efac" },
  { id: "emerald", label: "Emerald", hex: "#6ee7b7" },
  { id: "teal", label: "Teal", hex: "#5eead4" },
  { id: "cyan", label: "Cyan", hex: "#67e8f9" },
  { id: "sky", label: "Sky", hex: "#7dd3fc" },
  { id: "blue", label: "Blue", hex: "#93c5fd" },
  { id: "indigo", label: "Indigo", hex: "#a5b4fc" },
  { id: "violet", label: "Violet", hex: "#c4b5fd" },
  { id: "purple", label: "Purple", hex: "#d8b4fe" },
  { id: "fuchsia", label: "Fuchsia", hex: "#f0abfc" },
  { id: "pink", label: "Pink", hex: "#f9a8d4" },
] as const;

export type TextColorId = (typeof TEXT_COLORS)[number]["id"];

/** Soft block background highlights. */
export const HIGHLIGHT_COLORS = [
  { id: "none", label: "None", hex: "" },
  { id: "red", label: "Red", hex: "rgba(248, 113, 113, 0.18)" },
  { id: "orange", label: "Orange", hex: "rgba(251, 146, 60, 0.18)" },
  { id: "amber", label: "Amber", hex: "rgba(251, 191, 36, 0.18)" },
  { id: "lime", label: "Lime", hex: "rgba(163, 230, 53, 0.16)" },
  { id: "green", label: "Green", hex: "rgba(74, 222, 128, 0.16)" },
  { id: "teal", label: "Teal", hex: "rgba(45, 212, 191, 0.16)" },
  { id: "sky", label: "Sky", hex: "rgba(56, 189, 248, 0.16)" },
  { id: "blue", label: "Blue", hex: "rgba(96, 165, 250, 0.16)" },
  { id: "violet", label: "Violet", hex: "rgba(167, 139, 250, 0.18)" },
  { id: "pink", label: "Pink", hex: "rgba(244, 114, 182, 0.16)" },
  { id: "slate", label: "Slate", hex: "rgba(148, 163, 184, 0.14)" },
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
