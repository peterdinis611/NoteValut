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

export const templatesCollection = createCollection(
  localStorageCollectionOptions({
    id: "nv-custom-templates",
    storageKey: "notevault.db.templates",
    getKey: (item) => item.id,
    schema: CustomTemplateSchema,
  }),
);

function ensureSynced() {
  if (typeof window === "undefined") return;
  try {
    templatesCollection.startSyncImmediate();
  } catch {
    /* already syncing */
  }
}

export function loadCustomTemplates(): CustomPageTemplate[] {
  ensureSynced();
  return [...templatesCollection.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function getCustomTemplate(id: string) {
  ensureSynced();
  return templatesCollection.get(id);
}

export function saveCustomTemplate(
  template: Omit<CustomPageTemplate, "custom" | "createdAt"> & { createdAt?: number },
) {
  ensureSynced();
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
  ensureSynced();
  if (templatesCollection.has(id)) {
    templatesCollection.delete(id);
  }
}
