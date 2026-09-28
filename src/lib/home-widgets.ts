/** Configurable vault-home widget ids. */

export const HOME_WIDGET_IDS = ["streak", "due", "pinned", "graph", "focus"] as const;

export type HomeWidgetId = (typeof HOME_WIDGET_IDS)[number];

export const HOME_WIDGET_META: Record<
  HomeWidgetId,
  { label: string; description: string }
> = {
  streak: { label: "Streak", description: "Writing streak counter" },
  due: { label: "Due soon", description: "Overdue & upcoming todos" },
  pinned: { label: "Pinned", description: "Favorite pages" },
  graph: { label: "Graph", description: "Mini page-link map" },
  focus: { label: "Focus", description: "Focus mode toggle" },
};

export const DEFAULT_HOME_WIDGETS: HomeWidgetId[] = [
  "streak",
  "due",
  "pinned",
  "graph",
  "focus",
];

export function normalizeHomeWidgets(raw: string[] | undefined | null): HomeWidgetId[] {
  if (!raw?.length) return [...DEFAULT_HOME_WIDGETS];
  const allowed = new Set<string>(HOME_WIDGET_IDS);
  const out: HomeWidgetId[] = [];
  for (const id of raw) {
    if (allowed.has(id) && !out.includes(id as HomeWidgetId)) {
      out.push(id as HomeWidgetId);
    }
  }
  return out.length ? out : [...DEFAULT_HOME_WIDGETS];
}

export function toggleHomeWidget(
  current: HomeWidgetId[],
  id: HomeWidgetId,
): HomeWidgetId[] {
  if (current.includes(id)) {
    const next = current.filter((w) => w !== id);
    return next.length ? next : current; // keep at least one
  }
  return [...current, id];
}
