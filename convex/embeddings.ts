import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { requireOwner } from "./lib/auth";
import { embedText } from "./lib/embed";
import { buildNoteSearchText } from "./lib/searchText";

type SearchHit = {
  _id: Id<"notes">;
  title: string;
  icon: string;
  tags: string[];
  updatedAt: number;
  status?: string;
  preview: string;
  score: number;
};

export const embedNoteInternal = internalMutation({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note || note.kind === "folder" || note.trashed) return;
    const text =
      note.searchText ||
      buildNoteSearchText({
        title: note.title,
        content: note.content,
        description: note.description,
        status: note.status,
        tags: note.tags,
        blocks: note.blocks,
        folderBlocks: note.folderBlocks,
      });
    await ctx.db.patch(args.noteId, { embedding: embedText(text) });
  },
});

export const reindexOwner = mutation({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
    let n = 0;
    for (const note of notes) {
      if (note.kind === "folder" || note.trashed) continue;
      const text =
        note.searchText ||
        buildNoteSearchText({
          title: note.title,
          content: note.content,
          description: note.description,
          status: note.status,
          tags: note.tags,
          blocks: note.blocks,
          folderBlocks: note.folderBlocks,
        });
      await ctx.db.patch(note._id, { embedding: embedText(text) });
      n += 1;
    }
    return { indexed: n };
  },
});

export const getNotesByIds = internalQuery({
  args: { ids: v.array(v.id("notes")) },
  handler: async (ctx, args) => {
    const out: Array<{
      _id: Id<"notes">;
      title: string;
      icon: string;
      tags: string[];
      updatedAt: number;
      status?: string;
      preview: string;
    }> = [];
    for (const id of args.ids) {
      const note = await ctx.db.get(id);
      if (note && !note.trashed && note.kind !== "folder") {
        out.push({
          _id: note._id,
          title: note.title,
          icon: note.icon,
          tags: note.tags,
          updatedAt: note.updatedAt,
          status: note.status,
          preview: (note.searchText || note.content || "").slice(0, 140),
        });
      }
    }
    return out;
  },
});

/** Vector semantic search — Convex vectorIndex + local embeddings. */
export const search = action({
  args: {
    ownerId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<SearchHit[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== args.ownerId) {
      throw new Error("Forbidden");
    }
    const q = args.query.trim();
    if (q.length < 2) return [];
    const limit = Math.min(args.limit ?? 12, 24);
    const vector = embedText(q);

    const hits = await ctx.vectorSearch("notes", "by_embedding", {
      vector,
      limit,
      filter: (f) => f.eq("ownerId", args.ownerId),
    });

    const ids = hits.map((h) => h._id);
    const notes = await ctx.runQuery(internal.embeddings.getNotesByIds, { ids });
    const scoreById = new Map(hits.map((h) => [h._id, h._score]));
    return notes
      .map((n) => ({ ...n, score: scoreById.get(n._id) ?? 0 }))
      .sort((a, b) => b.score - a.score);
  },
});
