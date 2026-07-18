import { createCollection, localStorageCollectionOptions } from "@tanstack/react-db";
import * as v from "valibot";

export const CustomBlockTemplateSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  label: v.pipe(v.string(), v.minLength(1)),
  description: v.optional(v.string()),
  icon: v.optional(v.string()),
  body: v.optional(v.string()),
  updatedAt: v.optional(v.number()),
});

export type CustomBlockTemplate = v.InferOutput<typeof CustomBlockTemplateSchema>;

export const customBlocksCollection = createCollection(
  localStorageCollectionOptions({
    id: "nv-custom-blocks",
    storageKey: "notevault.db.custom-blocks",
    getKey: (item) => item.id,
    schema: CustomBlockTemplateSchema,
  }),
);

function ensureSynced() {
  if (typeof window === "undefined") return;
  try {
    customBlocksCollection.startSyncImmediate();
  } catch {
    /* already syncing */
  }
}

export function loadCustomBlockTemplates(): CustomBlockTemplate[] {
  if (typeof window === "undefined") return [];
  ensureSynced();
  return [...customBlocksCollection.values()].sort(
    (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0),
  );
}

export function saveCustomBlockTemplate(template: CustomBlockTemplate) {
  ensureSynced();
  const next: CustomBlockTemplate = {
    ...template,
    updatedAt: Date.now(),
  };

  for (const existing of customBlocksCollection.values()) {
    if (
      existing.id !== next.id &&
      existing.label.toLowerCase() === next.label.toLowerCase()
    ) {
      customBlocksCollection.delete(existing.id);
    }
  }

  if (customBlocksCollection.has(next.id)) {
    customBlocksCollection.update(next.id, (draft) => {
      draft.label = next.label;
      draft.description = next.description;
      draft.icon = next.icon;
      draft.body = next.body;
      draft.updatedAt = next.updatedAt;
    });
  } else {
    customBlocksCollection.insert(next);
  }

  const all = loadCustomBlockTemplates();
  if (all.length > 24) {
    for (const extra of all.slice(24)) {
      customBlocksCollection.delete(extra.id);
    }
  }
}

export function removeCustomBlockTemplate(id: string) {
  ensureSynced();
  if (customBlocksCollection.has(id)) {
    customBlocksCollection.delete(id);
  }
}

export function subscribeCustomBlocks(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  ensureSynced();
  const sub = customBlocksCollection.subscribeChanges(() => onChange());
  return () => sub.unsubscribe();
}
