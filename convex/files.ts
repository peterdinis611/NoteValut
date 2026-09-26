import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireOwner } from "./lib/auth";

/** Browser POSTs the file to this URL, then calls getUrl with the returned storageId. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/** Resolve a storage id to a durable URL right after upload (mutation so it is awaitable). */
export const resolveUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("File not found");
    return url;
  },
});

function extractStorageId(url: string): string | null {
  // Convex storage URLs contain /api/storage/<id> or end with the id.
  const m = url.match(/\/storage\/([^/?#]+)/i);
  if (m?.[1]) return m[1];
  return null;
}

function collectReferencedStorageIds(
  notes: Array<{
    trashed?: boolean;
    coverImage?: string;
    blocks?: Array<{ url?: string }>;
    folderBlocks?: Array<{ url?: string }>;
  }>,
): Set<string> {
  const ids = new Set<string>();
  for (const n of notes) {
    if (n.trashed) continue;
    if (n.coverImage) {
      const id = extractStorageId(n.coverImage);
      if (id) ids.add(id);
    }
    for (const b of [...(n.blocks ?? []), ...(n.folderBlocks ?? [])]) {
      if (!b.url) continue;
      const id = extractStorageId(b.url);
      if (id) ids.add(id);
    }
  }
  return ids;
}

/** Storage blobs not referenced by any active note (orphans). */
export const listOrphans = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
    const referenced = collectReferencedStorageIds(notes);

    const stored = await ctx.db.system.query("_storage").collect();
    const orphans: Array<{
      storageId: Id<"_storage">;
      url: string | null;
      size: number;
      contentType?: string;
      _creationTime: number;
    }> = [];

    for (const file of stored) {
      if (referenced.has(file._id)) continue;
      const url = await ctx.storage.getUrl(file._id);
      orphans.push({
        storageId: file._id,
        url,
        size: file.size,
        contentType: file.contentType,
        _creationTime: file._creationTime,
      });
    }

    return orphans.sort((a, b) => b._creationTime - a._creationTime).slice(0, 200);
  },
});

export const deleteOrphans = mutation({
  args: {
    ownerId: v.string(),
    storageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
    const referenced = collectReferencedStorageIds(notes);

    let deleted = 0;
    for (const id of args.storageIds) {
      if (referenced.has(id)) continue;
      await ctx.storage.delete(id);
      deleted += 1;
    }
    return { deleted };
  },
});
