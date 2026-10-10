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
    workspaceId?: string;
    action: string;
    summary: string;
    meta?: unknown;
  },
) {
  let workspaceId = args.workspaceId;
  if (!workspaceId && args.noteId) {
    const note = await ctx.db.get(args.noteId);
    workspaceId = note?.workspaceId ?? args.ownerId;
  }
  await ctx.db.insert("activityLog", {
    ownerId: args.ownerId,
    actorId: args.actorId ?? args.ownerId,
    actorName: args.actorName,
    noteId: args.noteId,
    workspaceId,
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
    workspaceId: v.optional(v.string()),
    action: v.optional(v.string()),
    actorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const limit = Math.min(args.limit ?? 40, 100);

    let rows;
    if (args.noteId) {
      rows = await ctx.db
        .query("activityLog")
        .withIndex("by_note", (q) => q.eq("noteId", args.noteId!))
        .order("desc")
        .take(limit * 3);
    } else if (args.workspaceId) {
      rows = await ctx.db
        .query("activityLog")
        .withIndex("by_workspace_time", (q) =>
          q.eq("workspaceId", args.workspaceId!),
        )
        .order("desc")
        .take(limit * 3);
    } else {
      rows = await ctx.db
        .query("activityLog")
        .withIndex("by_owner_time", (q) => q.eq("ownerId", args.ownerId))
        .order("desc")
        .take(limit * 3);
    }

    return rows
      .filter((r) => {
        if (args.action && r.action !== args.action) return false;
        if (args.actorId && r.actorId !== args.actorId) return false;
        if (
          args.workspaceId &&
          args.noteId &&
          r.workspaceId &&
          r.workspaceId !== args.workspaceId
        ) {
          return false;
        }
        return true;
      })
      .slice(0, limit);
  },
});

export const record = mutation({
  args: {
    ownerId: v.string(),
    noteId: v.optional(v.id("notes")),
    action: v.string(),
    summary: v.string(),
    actorName: v.optional(v.string()),
    workspaceId: v.optional(v.string()),
    meta: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    await logActivity(ctx, {
      ownerId: args.ownerId,
      actorId: args.ownerId,
      actorName: args.actorName,
      noteId: args.noteId,
      workspaceId: args.workspaceId,
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
    workspaceId: v.optional(v.string()),
    meta: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await logActivity(ctx, args);
  },
});
