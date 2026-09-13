import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwner } from "./lib/auth";

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

export const get = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    return (
      (await ctx.db
        .query("vaultStats")
        .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
        .first()) ?? {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDay: undefined,
        totalFocusMinutes: 0,
      }
    );
  },
});

/** Call when the user writes / focuses — bumps daily streak. */
export const recordActivity = mutation({
  args: {
    ownerId: v.string(),
    focusMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const today = todayKey();
    const existing = await ctx.db
      .query("vaultStats")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();

    const focusAdd = Math.max(0, Math.floor(args.focusMinutes ?? 0));
    const now = Date.now();

    if (!existing) {
      return await ctx.db.insert("vaultStats", {
        ownerId: args.ownerId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDay: today,
        totalFocusMinutes: focusAdd,
        updatedAt: now,
      });
    }

    if (existing.lastActiveDay === today) {
      if (focusAdd) {
        await ctx.db.patch(existing._id, {
          totalFocusMinutes: (existing.totalFocusMinutes ?? 0) + focusAdd,
          updatedAt: now,
        });
      }
      return existing._id;
    }

    const continued = existing.lastActiveDay === yesterdayKey();
    const currentStreak = continued ? existing.currentStreak + 1 : 1;
    const longestStreak = Math.max(existing.longestStreak, currentStreak);

    await ctx.db.patch(existing._id, {
      currentStreak,
      longestStreak,
      lastActiveDay: today,
      totalFocusMinutes: (existing.totalFocusMinutes ?? 0) + focusAdd,
      updatedAt: now,
    });
    return existing._id;
  },
});
