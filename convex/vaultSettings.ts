import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwner } from "./lib/auth";

export const get = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const existing = await ctx.db
      .query("vaultSettings")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();

    if (existing) return existing;

    return {
      ownerId: args.ownerId,
      sharingEnabled: false,
      publicReadonly: true,
      backgroundImage: undefined as string | undefined,
      updatedAt: Date.now(),
    };
  },
});

export const update = mutation({
  args: {
    ownerId: v.string(),
    sharingEnabled: v.optional(v.boolean()),
    publicReadonly: v.optional(v.boolean()),
    backgroundImage: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const existing = await ctx.db
      .query("vaultSettings")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();

    const now = Date.now();

    if (existing) {
      const updates: Record<string, unknown> = { updatedAt: now };
      if (args.sharingEnabled !== undefined) updates.sharingEnabled = args.sharingEnabled;
      if (args.publicReadonly !== undefined) updates.publicReadonly = args.publicReadonly;
      if (args.backgroundImage !== undefined) {
        updates.backgroundImage = args.backgroundImage ?? undefined;
      }
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    return await ctx.db.insert("vaultSettings", {
      ownerId: args.ownerId,
      sharingEnabled: args.sharingEnabled ?? false,
      publicReadonly: args.publicReadonly ?? true,
      backgroundImage: args.backgroundImage ?? undefined,
      updatedAt: now,
    });
  },
});
