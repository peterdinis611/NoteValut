import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireOwner } from "./lib/auth";
import { assertTags } from "./tags";
import { logActivity } from "./activity";

export const list = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    return await ctx.db
      .query("inboxRules")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    ownerId: v.string(),
    id: v.optional(v.id("inboxRules")),
    name: v.string(),
    enabled: v.boolean(),
    matchType: v.union(
      v.literal("always"),
      v.literal("titleContains"),
      v.literal("hasTag"),
    ),
    matchValue: v.optional(v.string()),
    addTags: v.optional(v.array(v.string())),
    setStatus: v.optional(v.string()),
    moveToFolderId: v.optional(v.id("notes")),
    remindInHours: v.optional(v.number()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const now = Date.now();
    const payload = {
      ownerId: args.ownerId,
      enabled: args.enabled,
      name: args.name.trim().slice(0, 80) || "Rule",
      matchType: args.matchType,
      matchValue: args.matchValue?.trim(),
      addTags: args.addTags ? assertTags(args.addTags) : undefined,
      setStatus: args.setStatus,
      moveToFolderId: args.moveToFolderId,
      remindInHours: args.remindInHours,
      sortOrder: args.sortOrder ?? 0,
      updatedAt: now,
    };
    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing || existing.ownerId !== args.ownerId) throw new Error("Not found");
      await ctx.db.patch(args.id, payload);
      return args.id;
    }
    return await ctx.db.insert("inboxRules", payload);
  },
});

export const remove = mutation({
  args: { ownerId: v.string(), id: v.id("inboxRules") },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.ownerId !== args.ownerId) throw new Error("Not found");
    await ctx.db.delete(args.id);
  },
});

/** Apply enabled rules to a freshly created capture note. */
export const applyToNote = mutation({
  args: {
    ownerId: v.string(),
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const note = await ctx.db.get(args.noteId);
    if (!note || note.ownerId !== args.ownerId) throw new Error("Not found");

    const rules = (
      await ctx.db
        .query("inboxRules")
        .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
        .collect()
    )
      .filter((r) => r.enabled)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    let tags = [...(note.tags ?? [])];
    let status = note.status;
    let parentId = note.parentId as Id<"notes"> | undefined;
    let remindInHours: number | undefined;
    let applied = 0;

    for (const rule of rules) {
      let match = false;
      if (rule.matchType === "always") match = true;
      else if (rule.matchType === "titleContains" && rule.matchValue) {
        match = note.title.toLowerCase().includes(rule.matchValue.toLowerCase());
      } else if (rule.matchType === "hasTag" && rule.matchValue) {
        match = tags.some((t) => t.toLowerCase() === rule.matchValue!.toLowerCase());
      }
      if (!match) continue;
      applied += 1;
      if (rule.addTags?.length) {
        for (const t of rule.addTags) {
          if (!tags.some((x) => x.toLowerCase() === t.toLowerCase())) tags.push(t);
        }
      }
      if (rule.setStatus !== undefined) status = rule.setStatus;
      if (rule.moveToFolderId) parentId = rule.moveToFolderId;
      if (rule.remindInHours && rule.remindInHours > 0) remindInHours = rule.remindInHours;
    }

    if (applied > 0) {
      await ctx.db.patch(args.noteId, {
        tags: assertTags(tags),
        status,
        parentId,
        updatedAt: Date.now(),
      });
      await logActivity(ctx, {
        ownerId: args.ownerId,
        noteId: args.noteId,
        action: "inbox_rule",
        summary: `Applied ${applied} inbox rule${applied === 1 ? "" : "s"}`,
      });
    }

    return { applied, remindInHours, status, tags, parentId };
  },
});
