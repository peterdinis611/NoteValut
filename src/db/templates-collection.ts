import { createCollection, localStorageCollectionOptions } from "@tanstack/react-db";
import * as v from "valibot";
import { BlockSchema } from "@/lib/validation";

export const CustomTemplateSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(60)),
  icon: v.string(),
  description: v.string(),
  tags: v.array(v.string()),
  blocks: v.array(BlockSchema),
  createdAt: v.number(),
  custom: v.literal(true),
});

export type CustomPageTemplate = v.InferOutput<typeof CustomTemplateSchema>;

const LEGACY_KEY = "notevault.custom-templates";

export const templatesCollection = createCollection(
  localStorageCollectionOptions({
    id: "nv-custom-templates",
    storageKey: "notevault.db.templates",
    getKey: (item) => item.id,
    schema: CustomTemplateSchema,
  }),
);

let migrated = false;

/** One-time migrate from the old raw localStorage array. */
export function migrateLegacyTemplates() {
  if (migrated || typeof window === "undefined") return;
  migrated = true;
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as CustomPageTemplate[];
    if (!Array.isArray(parsed)) return;
    for (const item of parsed) {
      if (!item?.id || templatesCollection.has(item.id)) continue;
      const result = v.safeParse(CustomTemplateSchema, {
        ...item,
        custom: true as const,
        createdAt: item.createdAt ?? Date.now(),
        tags: item.tags ?? [],
        description: item.description ?? "Saved from your vault",
        blocks: item.blocks ?? [],
      });
      if (result.success) {
        templatesCollection.insert(result.output);
      }
    }
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore corrupt legacy data
  }
}

export function loadCustomTemplates(): CustomPageTemplate[] {
  migrateLegacyTemplates();
  return [...templatesCollection.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function getCustomTemplate(id: string) {
  migrateLegacyTemplates();
  return templatesCollection.get(id);
}

export function saveCustomTemplate(
  template: Omit<CustomPageTemplate, "custom" | "createdAt"> & { createdAt?: number },
) {
  migrateLegacyTemplates();
  const next: CustomPageTemplate = {
    ...template,
    custom: true,
    createdAt: template.createdAt ?? Date.now(),
  };

  for (const existing of templatesCollection.values()) {
    if (
      existing.id !== next.id &&
      existing.name.toLowerCase() === next.name.toLowerCase()
    ) {
      templatesCollection.delete(existing.id);
    }
  }

  if (templatesCollection.has(next.id)) {
    templatesCollection.update(next.id, (draft) => {
      draft.name = next.name;
      draft.icon = next.icon;
      draft.description = next.description;
      draft.tags = next.tags;
      draft.blocks = next.blocks;
      draft.createdAt = next.createdAt;
      draft.custom = true;
    });
  } else {
    templatesCollection.insert(next);
  }

  const all = loadCustomTemplates();
  if (all.length > 32) {
    for (const extra of all.slice(32)) {
      templatesCollection.delete(extra.id);
    }
  }
}

export function removeCustomTemplate(id: string) {
  migrateLegacyTemplates();
  if (templatesCollection.has(id)) {
    templatesCollection.delete(id);
  }
}
