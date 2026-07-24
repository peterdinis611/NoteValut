import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { requireOwner } from "./lib/auth";

function formatReminderTitle(dailyKey: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dailyKey);
  if (!m) return `Daily reminder · ${dailyKey}`;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return `Daily · ${date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })}`;
}

/** Schedule (or reschedule) a reminder for a calendar day. */
export const schedule = mutation({
  args: {
    ownerId: v.string(),
    dailyKey: v.string(),
    remindAt: v.number(),
    noteId: v.optional(v.id("notes")),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.dailyKey)) {
      throw new Error("Invalid daily key");
    }
    if (args.remindAt <= Date.now() - 5_000) {
      throw new Error("Pick a time in the future");
    }

    // Cancel any existing scheduled reminders for this day.
    const existing = await ctx.db
      .query("reminders")
      .withIndex("by_owner_daily", (q) =>
        q.eq("ownerId", args.ownerId).eq("dailyKey", args.dailyKey),
      )
      .collect();

    for (const row of existing) {
      if (row.status === "scheduled") {
        if (row.jobId) {
          try {
            await ctx.scheduler.cancel(row.jobId);
          } catch {
            /* already ran / cancelled */
          }
        }
        await ctx.db.patch(row._id, { status: "cancelled" });
      }
    }

    const now = Date.now();
    const reminderId = await ctx.db.insert("reminders", {
      ownerId: args.ownerId,
      dailyKey: args.dailyKey,
      noteId: args.noteId,
      title: args.title?.trim() || formatReminderTitle(args.dailyKey),
      remindAt: args.remindAt,
      status: "scheduled",
      createdAt: now,
    });

    const jobId = await ctx.scheduler.runAt(
      args.remindAt,
      internal.reminders.fire,
      { reminderId },
    );
    await ctx.db.patch(reminderId, { jobId });
    return reminderId;
  },
});

export const cancel = mutation({
  args: {
    ownerId: v.string(),
    reminderId: v.id("reminders"),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const row = await ctx.db.get(args.reminderId);
    if (!row || row.ownerId !== args.ownerId) throw new Error("Not found");
    if (row.status !== "scheduled") return;
    if (row.jobId) {
      try {
        await ctx.scheduler.cancel(row.jobId);
      } catch {
        /* ignore */
      }
    }
    await ctx.db.patch(args.reminderId, { status: "cancelled" });
  },
});

export const dismiss = mutation({
  args: {
    ownerId: v.string(),
    reminderId: v.id("reminders"),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const row = await ctx.db.get(args.reminderId);
    if (!row || row.ownerId !== args.ownerId) throw new Error("Not found");
    if (row.status !== "fired") return;
    await ctx.db.patch(args.reminderId, { status: "dismissed" });
  },
});

/** Fired reminders waiting to be shown in the open app. */
export const listFired = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    return await ctx.db
      .query("reminders")
      .withIndex("by_owner_status", (q) =>
        q.eq("ownerId", args.ownerId).eq("status", "fired"),
      )
      .collect();
  },
});

/** Upcoming scheduled reminders for a set of daily keys (calendar dots). */
export const listScheduledForKeys = query({
  args: {
    ownerId: v.string(),
    keys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const found: Record<
      string,
      { id: string; remindAt: number; title: string }
    > = {};
    for (const key of args.keys) {
      const rows = await ctx.db
        .query("reminders")
        .withIndex("by_owner_daily", (q) =>
          q.eq("ownerId", args.ownerId).eq("dailyKey", key),
        )
        .collect();
      const scheduled = rows
        .filter((r) => r.status === "scheduled")
        .sort((a, b) => a.remindAt - b.remindAt)[0];
      if (scheduled) {
        found[key] = {
          id: scheduled._id,
          remindAt: scheduled.remindAt,
          title: scheduled.title,
        };
      }
    }
    return found;
  },
});

export const fire = internalMutation({
  args: { reminderId: v.id("reminders") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.reminderId);
    if (!row || row.status !== "scheduled") return;
    await ctx.db.patch(args.reminderId, {
      status: "fired",
      firedAt: Date.now(),
    });
  },
});
