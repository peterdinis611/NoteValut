import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { requireOwner } from "./lib/auth";

export async function logActivity(
  ctx: MutationCtx,
  args: {
    ownerId: string;
    actorId?: string;
    actorName?: string;
    noteId?: Id<"notes">;
    action: string;
    summary: string;
    meta?: unknown;
  },
) {
  await ctx.db.insert("activityLog", {
    ownerId: args.ownerId,
    actorId: args.actorId ?? args.ownerId,
    actorName: args.actorName,
    noteId: args.noteId,
    action: args.action,
    summary: args.summary.slice(0, 240),
    meta: args.meta,
    createdAt: Date.now(),
  });
}

export const list = query({
  args: {
    ownerId: v.string(),
    limit: v.optional(v.number()),
    noteId: v.optional(v.id("notes")),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const limit = Math.min(args.limit ?? 40, 100);
    if (args.noteId) {
      return await ctx.db
        .query("activityLog")
        .withIndex("by_note", (q) => q.eq("noteId", args.noteId!))
        .order("desc")
        .take(limit);
    }
    return await ctx.db
      .query("activityLog")
      .withIndex("by_owner_time", (q) => q.eq("ownerId", args.ownerId))
      .order("desc")
      .take(limit);
  },
});

export const record = mutation({
  args: {
    ownerId: v.string(),
    noteId: v.optional(v.id("notes")),
    action: v.string(),
    summary: v.string(),
    actorName: v.optional(v.string()),
    meta: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    await logActivity(ctx, {
      ownerId: args.ownerId,
      actorId: args.ownerId,
      actorName: args.actorName,
      noteId: args.noteId,
      action: args.action,
      summary: args.summary,
      meta: args.meta,
    });
  },
});

export const recordInternal = internalMutation({
  args: {
    ownerId: v.string(),
    noteId: v.optional(v.id("notes")),
    action: v.string(),
    summary: v.string(),
    meta: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await logActivity(ctx, args);
  },
});
