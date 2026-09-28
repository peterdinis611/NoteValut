import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwner } from "./lib/auth";
import { blockValidator } from "./block";
import { buildNoteSearchText } from "./lib/searchText";
import { embedText } from "./lib/embed";

const weekdayValidator = v.union(
  v.literal(0),
  v.literal(1),
  v.literal(2),
  v.literal(3),
  v.literal(4),
  v.literal(5),
  v.literal(6),
);

function dayKey(ms = Date.now()) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const list = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    return await ctx.db
      .query("recurringTemplates")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    ownerId: v.string(),
    id: v.optional(v.id("recurringTemplates")),
    name: v.string(),
    titleTemplate: v.string(),
    weekday: weekdayValidator,
    enabled: v.boolean(),
    parentId: v.optional(v.id("notes")),
    blocks: v.optional(v.array(blockValidator)),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const now = Date.now();
    const payload = {
      ownerId: args.ownerId,
      name: args.name.trim().slice(0, 80) || "Recurring",
      titleTemplate: args.titleTemplate.trim().slice(0, 120) || "{{name}}",
      weekday: args.weekday,
      enabled: args.enabled,
      parentId: args.parentId,
      blocks: args.blocks,
      tags: args.tags ?? [],
      updatedAt: now,
    };
    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing || existing.ownerId !== args.ownerId) throw new Error("Not found");
      await ctx.db.patch(args.id, payload);
      return args.id;
    }
    return await ctx.db.insert("recurringTemplates", {
      ...payload,
      lastFiredKey: undefined,
    });
  },
});

export const remove = mutation({
  args: { ownerId: v.string(), id: v.id("recurringTemplates") },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.ownerId !== args.ownerId) throw new Error("Not found");
    await ctx.db.delete(args.id);
  },
});

/** Create today's pages for enabled templates matching weekday (idempotent per day). */
export const runDue = mutation({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const today = new Date();
    const weekday = today.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const key = dayKey(today.getTime());
    const settings = await ctx.db
      .query("vaultSettings")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();
    const workspaceId = settings?.activeWorkspaceId ?? args.ownerId;

    const templates = (
      await ctx.db
        .query("recurringTemplates")
        .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
        .collect()
    ).filter((t) => t.enabled && t.weekday === weekday && t.lastFiredKey !== key);

    const created: string[] = [];
    for (const t of templates) {
      const title = t.titleTemplate
        .replaceAll("{{name}}", t.name)
        .replaceAll("{{date}}", key);
      const blocks = t.blocks?.length
        ? t.blocks
        : [{ id: crypto.randomUUID(), type: "paragraph" as const, text: "" }];
      const content = blocks.map((b) => b.text).join("\n");
      const searchText = buildNoteSearchText({
        title,
        content,
        tags: t.tags,
        blocks,
      });
      const noteId = await ctx.db.insert("notes", {
        ownerId: args.ownerId,
        workspaceId,
        title,
        content,
        blocks,
        icon: "🔁",
        parentId: t.parentId,
        kind: "page",
        pinned: false,
        archived: false,
        trashed: false,
        tags: t.tags ?? [],
        searchText,
        embedding: embedText(searchText),
        updatedAt: Date.now(),
      });
      await ctx.db.patch(t._id, { lastFiredKey: key, updatedAt: Date.now() });
      created.push(noteId);
    }
    return { created: created.length, key };
  },
});
