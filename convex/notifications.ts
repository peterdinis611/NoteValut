import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireOwner } from "./lib/auth";

export async function notifyMention(
  ctx: MutationCtx,
  args: {
    ownerId: string;
    recipientId: string;
    noteId: Id<"notes">;
    commentId: Id<"comments">;
    fromName: string;
    body: string;
  },
) {
  if (args.recipientId === args.ownerId && args.fromName === "You") return;
  await ctx.db.insert("notifications", {
    ownerId: args.ownerId,
    recipientId: args.recipientId,
    kind: "mention",
    noteId: args.noteId,
    commentId: args.commentId,
    title: `${args.fromName} mentioned you`,
    body: args.body.slice(0, 200),
    read: false,
    createdAt: Date.now(),
  });
}

export const listForUser = query({
  args: { ownerId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const limit = Math.min(args.limit ?? 30, 80);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", args.ownerId))
      .order("desc")
      .take(limit);
    return rows;
  },
});

export const unreadCount = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_unread", (q) =>
        q.eq("recipientId", args.ownerId).eq("read", false),
      )
      .take(50);
    return rows.length;
  },
});

export const markRead = mutation({
  args: {
    ownerId: v.string(),
    id: v.optional(v.id("notifications")),
    all: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    if (args.all) {
      const rows = await ctx.db
        .query("notifications")
        .withIndex("by_recipient_unread", (q) =>
          q.eq("recipientId", args.ownerId).eq("read", false),
        )
        .collect();
      for (const row of rows) {
        await ctx.db.patch(row._id, { read: true });
      }
      return rows.length;
    }
    if (!args.id) throw new Error("Missing id");
    const row = await ctx.db.get(args.id);
    if (!row || row.recipientId !== args.ownerId) throw new Error("Not found");
    await ctx.db.patch(args.id, { read: true });
    return 1;
  },
});
