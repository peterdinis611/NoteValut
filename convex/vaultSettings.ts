import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("vaultSettings")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();

    if (existing) return existing;

    return {
      ownerId: args.ownerId,
      sharingEnabled: false,
      publicReadonly: true,
      updatedAt: Date.now(),
    };
  },
});

export const update = mutation({
  args: {
    ownerId: v.string(),
    sharingEnabled: v.optional(v.boolean()),
    publicReadonly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("vaultSettings")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();

    const now = Date.now();
    const patch = {
      sharingEnabled: args.sharingEnabled,
      publicReadonly: args.publicReadonly,
    };

    if (existing) {
      const updates: Record<string, unknown> = { updatedAt: now };
      if (patch.sharingEnabled !== undefined) updates.sharingEnabled = patch.sharingEnabled;
      if (patch.publicReadonly !== undefined) updates.publicReadonly = patch.publicReadonly;
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    return await ctx.db.insert("vaultSettings", {
      ownerId: args.ownerId,
      sharingEnabled: args.sharingEnabled ?? false,
      publicReadonly: args.publicReadonly ?? true,
      updatedAt: now,
    });
  },
});
