import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwner } from "./lib/auth";

const DEFAULT_HOME_WIDGETS = ["streak", "due", "pinned", "graph", "focus"];

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
      autoDailyNote: false as boolean | undefined,
      dailyReminderTime: undefined as string | undefined,
      trashRetentionDays: 30 as number | undefined,
      homeWidgets: DEFAULT_HOME_WIDGETS as string[] | undefined,
      activeWorkspaceId: undefined as string | undefined,
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
    autoDailyNote: v.optional(v.boolean()),
    dailyReminderTime: v.optional(v.union(v.string(), v.null())),
    trashRetentionDays: v.optional(v.number()),
    homeWidgets: v.optional(v.array(v.string())),
    activeWorkspaceId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const existing = await ctx.db
      .query("vaultSettings")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();

    const now = Date.now();
    const allowed = new Set(DEFAULT_HOME_WIDGETS);

    if (existing) {
      const updates: Record<string, unknown> = { updatedAt: now };
      if (args.sharingEnabled !== undefined) updates.sharingEnabled = args.sharingEnabled;
      if (args.publicReadonly !== undefined) updates.publicReadonly = args.publicReadonly;
      if (args.backgroundImage !== undefined) {
        updates.backgroundImage = args.backgroundImage ?? undefined;
      }
      if (args.autoDailyNote !== undefined) updates.autoDailyNote = args.autoDailyNote;
      if (args.dailyReminderTime !== undefined) {
        updates.dailyReminderTime = args.dailyReminderTime ?? undefined;
      }
      if (args.trashRetentionDays !== undefined) {
        updates.trashRetentionDays = Math.max(0, Math.min(365, Math.floor(args.trashRetentionDays)));
      }
      if (args.homeWidgets !== undefined) {
        const cleaned = args.homeWidgets.filter((id) => allowed.has(id));
        updates.homeWidgets = cleaned.length ? cleaned : DEFAULT_HOME_WIDGETS;
      }
      if (args.activeWorkspaceId !== undefined) {
        updates.activeWorkspaceId = args.activeWorkspaceId ?? undefined;
      }
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    const homeWidgets =
      args.homeWidgets !== undefined
        ? args.homeWidgets.filter((id) => allowed.has(id))
        : DEFAULT_HOME_WIDGETS;

    return await ctx.db.insert("vaultSettings", {
      ownerId: args.ownerId,
      sharingEnabled: args.sharingEnabled ?? false,
      publicReadonly: args.publicReadonly ?? true,
      backgroundImage: args.backgroundImage ?? undefined,
      autoDailyNote: args.autoDailyNote ?? false,
      dailyReminderTime: args.dailyReminderTime ?? undefined,
      trashRetentionDays:
        args.trashRetentionDays !== undefined
          ? Math.max(0, Math.min(365, Math.floor(args.trashRetentionDays)))
          : 30,
      homeWidgets: homeWidgets.length ? homeWidgets : DEFAULT_HOME_WIDGETS,
      activeWorkspaceId: args.activeWorkspaceId ?? undefined,
      updatedAt: now,
    });
  },
});
