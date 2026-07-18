/**
 * One-shot import of pre–TanStack-DB keys into collections, then delete them.
 * App code never reads/writes these keys afterwards — persistence goes through TanStack DB.
 */
import { customBlocksCollection } from "@/db/custom-blocks-collection";
import { ownerCollection } from "@/db/owner-collection";
import { templatesCollection, type CustomPageTemplate } from "@/db/templates-collection";
import * as v from "valibot";
import { CustomBlockTemplateSchema } from "@/db/custom-blocks-collection";
import { CustomTemplateSchema } from "@/db/templates-collection";

const LEGACY = {
  owner: "notevault-owner-id",
  blocks: "notevault.custom-blocks",
  templates: "notevault.custom-templates",
} as const;

let ran = false;

export function migrateLegacyLocalStorageOnce() {
  if (ran || typeof window === "undefined") return;
  ran = true;

  try {
    ownerCollection.startSyncImmediate();
    customBlocksCollection.startSyncImmediate();
    templatesCollection.startSyncImmediate();
  } catch {
    /* syncing */
  }

  try {
    if (!ownerCollection.has("owner")) {
      const old = window.localStorage.getItem(LEGACY.owner);
      if (old) {
        ownerCollection.insert({
          id: "owner",
          ownerId: old,
          updatedAt: Date.now(),
        });
      }
    }
    window.localStorage.removeItem(LEGACY.owner);
  } catch {
    /* ignore */
  }

  try {
    const raw = window.localStorage.getItem(LEGACY.blocks);
    if (raw && [...customBlocksCollection.values()].length === 0) {
      const parsed = JSON.parse(raw) as unknown[];
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const result = v.safeParse(CustomBlockTemplateSchema, {
            ...(item as object),
            updatedAt: Date.now(),
          });
          if (result.success && !customBlocksCollection.has(result.output.id)) {
            customBlocksCollection.insert(result.output);
          }
        }
      }
    }
    window.localStorage.removeItem(LEGACY.blocks);
  } catch {
    /* ignore */
  }

  try {
    const raw = window.localStorage.getItem(LEGACY.templates);
    if (raw) {
      const parsed = JSON.parse(raw) as CustomPageTemplate[];
      if (Array.isArray(parsed)) {
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
          if (result.success) templatesCollection.insert(result.output);
        }
      }
    }
    window.localStorage.removeItem(LEGACY.templates);
  } catch {
    /* ignore */
  }
}
