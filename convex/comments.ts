import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwner } from "./lib/auth";

export const listForNote = query({
  args: { ownerId: v.string(), noteId: v.id("notes") },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const note = await ctx.db.get(args.noteId);
    if (!note || note.ownerId !== args.ownerId) return [];
    return await ctx.db
      .query("comments")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .order("asc")
      .collect();
  },
});

export const create = mutation({
  args: {
    ownerId: v.string(),
    noteId: v.id("notes"),
    authorId: v.string(),
    authorName: v.string(),
    body: v.string(),
    mentionIds: v.optional(v.array(v.string())),
    blockId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const note = await ctx.db.get(args.noteId);
    if (!note || note.ownerId !== args.ownerId) throw new Error("Not found");
    const body = args.body.trim();
    if (!body) throw new Error("Empty comment");
    const now = Date.now();
    return await ctx.db.insert("comments", {
      ownerId: args.ownerId,
      noteId: args.noteId,
      authorId: args.authorId,
      authorName: args.authorName.trim() || "You",
      body: body.slice(0, 4000),
      mentionIds: args.mentionIds,
      blockId: args.blockId,
      resolved: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const resolve = mutation({
  args: {
    ownerId: v.string(),
    commentId: v.id("comments"),
    resolved: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const c = await ctx.db.get(args.commentId);
    if (!c || c.ownerId !== args.ownerId) throw new Error("Not found");
    await ctx.db.patch(args.commentId, { resolved: args.resolved, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { ownerId: v.string(), commentId: v.id("comments") },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const c = await ctx.db.get(args.commentId);
    if (!c || c.ownerId !== args.ownerId) throw new Error("Not found");
    await ctx.db.delete(args.commentId);
  },
});
