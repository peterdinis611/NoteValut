import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwner } from "./lib/auth";

export const getByKey = query({
  args: { ownerId: v.string(), key: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    return await ctx.db
      .query("syncedBlocks")
      .withIndex("by_owner_key", (q) => q.eq("ownerId", args.ownerId).eq("key", args.key))
      .first();
  },
});

export const list = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    return await ctx.db
      .query("syncedBlocks")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    ownerId: v.string(),
    key: v.string(),
    text: v.string(),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const existing = await ctx.db
      .query("syncedBlocks")
      .withIndex("by_owner_key", (q) => q.eq("ownerId", args.ownerId).eq("key", args.key))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        text: args.text,
        label: args.label ?? existing.label,
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("syncedBlocks", {
      ownerId: args.ownerId,
      key: args.key,
      text: args.text,
      label: args.label ?? "Synced block",
      updatedAt: now,
    });
  },
});
