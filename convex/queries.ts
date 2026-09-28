import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwner } from "./lib/auth";

export const list = query({
  args: { ownerId: v.string(), folderId: v.optional(v.id("notes")) },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const all = await ctx.db
      .query("savedQueries")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
    if (args.folderId) {
      return all.filter((q) => q.folderId === args.folderId);
    }
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const save = mutation({
  args: {
    ownerId: v.string(),
    id: v.optional(v.id("savedQueries")),
    name: v.string(),
    query: v.string(),
    folderId: v.optional(v.id("notes")),
    viewMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const name = args.name.trim().slice(0, 80) || "Untitled query";
    const queryText = args.query.trim().slice(0, 500);
    const now = Date.now();
    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing || existing.ownerId !== args.ownerId) throw new Error("Not found");
      await ctx.db.patch(args.id, {
        name,
        query: queryText,
        folderId: args.folderId,
        viewMode: args.viewMode,
        updatedAt: now,
      });
      return args.id;
    }
    return await ctx.db.insert("savedQueries", {
      ownerId: args.ownerId,
      folderId: args.folderId,
      name,
      query: queryText,
      viewMode: args.viewMode,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: { ownerId: v.string(), id: v.id("savedQueries") },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.ownerId !== args.ownerId) throw new Error("Not found");
    await ctx.db.delete(args.id);
  },
});

/** Run a query string against the vault (client can also evaluate locally). */
export const run = query({
  args: {
    ownerId: v.string(),
    query: v.string(),
    folderId: v.optional(v.id("notes")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const limit = Math.min(args.limit ?? 40, 100);
    const q = args.query.trim().toLowerCase();

    let notes = await ctx.db
      .query("notes")
      .withIndex("by_owner", (q2) => q2.eq("ownerId", args.ownerId))
      .collect();
    notes = notes.filter((n) => !n.trashed && n.kind !== "folder" && !n.archived);

    if (args.folderId) {
      notes = notes.filter((n) => n.parentId === args.folderId);
    }

    // Parse simple tokens: status:X tag:Y prop:key=val text…
    const statusM = q.match(/status:(\S+)/);
    const tagMs = [...q.matchAll(/(?:tag:|#)(\S+)/g)].map((m) => m[1]!);
    const propMs = [...q.matchAll(/prop:([^=\s]+)=(\S+)/g)];
    const text = q
      .replace(/status:\S+/g, "")
      .replace(/(?:tag:|#)\S+/g, "")
      .replace(/prop:[^=\s]+=\S+/g, "")
      .trim();

    const hits = notes.filter((n) => {
      if (statusM && (n.status || "").toLowerCase() !== statusM[1]) return false;
      for (const t of tagMs) {
        if (!(n.tags ?? []).some((x) => x.toLowerCase() === t)) return false;
      }
      const props = (n.properties ?? {}) as Record<string, unknown>;
      for (const m of propMs) {
        const val = props[m[1]!];
        if (String(val ?? "").toLowerCase() !== m[2]!.toLowerCase()) return false;
      }
      if (text) {
        const hay = (n.searchText || `${n.title} ${n.content}`).toLowerCase();
        if (!hay.includes(text)) return false;
      }
      return true;
    });

    return hits
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit)
      .map((n) => ({
        _id: n._id,
        title: n.title,
        icon: n.icon,
        status: n.status,
        tags: n.tags,
        updatedAt: n.updatedAt,
        properties: n.properties,
      }));
  },
});
