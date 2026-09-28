import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwner } from "./lib/auth";
import { notifyMention } from "./notifications";

export const listForNote = query({
  args: { ownerId: v.string(), noteId: v.id("notes") },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const note = await ctx.db.get(args.noteId);
    if (!note || note.ownerId !== args.ownerId) return [];
    return await ctx.db
      .query("comments")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .order("asc")
      .collect();
  },
});

export const create = mutation({
  args: {
    ownerId: v.string(),
    noteId: v.id("notes"),
    authorId: v.string(),
    authorName: v.string(),
    body: v.string(),
    mentionIds: v.optional(v.array(v.string())),
    blockId: v.optional(v.string()),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const note = await ctx.db.get(args.noteId);
    if (!note || note.ownerId !== args.ownerId) throw new Error("Not found");
    const body = args.body.trim();
    if (!body) throw new Error("Empty comment");
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent || parent.noteId !== args.noteId) throw new Error("Invalid thread");
    }
    const now = Date.now();
    const commentId = await ctx.db.insert("comments", {
      ownerId: args.ownerId,
      noteId: args.noteId,
      authorId: args.authorId,
      authorName: args.authorName.trim() || "You",
      body: body.slice(0, 4000),
      mentionIds: args.mentionIds,
      blockId: args.blockId,
      parentId: args.parentId,
      resolved: false,
      createdAt: now,
      updatedAt: now,
    });

    for (const mid of args.mentionIds ?? []) {
      await notifyMention(ctx, {
        ownerId: args.ownerId,
        recipientId: mid === "you" ? args.ownerId : mid,
        noteId: args.noteId,
        commentId,
        fromName: args.authorName.trim() || "Someone",
        body,
      });
    }

    return commentId;
  },
});

export const resolve = mutation({
  args: {
    ownerId: v.string(),
    commentId: v.id("comments"),
    resolved: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const c = await ctx.db.get(args.commentId);
    if (!c || c.ownerId !== args.ownerId) throw new Error("Not found");
    await ctx.db.patch(args.commentId, { resolved: args.resolved, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { ownerId: v.string(), commentId: v.id("comments") },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const c = await ctx.db.get(args.commentId);
    if (!c || c.ownerId !== args.ownerId) throw new Error("Not found");
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", args.commentId))
      .collect();
    for (const r of replies) await ctx.db.delete(r._id);
    await ctx.db.delete(args.commentId);
  },
});

/** People you can @mention — share labels + prior comment authors. */
export const listPeople = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const people = new Map<string, { id: string; name: string; source: string }>();

    const shares = await ctx.db
      .query("shares")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
    for (const s of shares) {
      if (!s.enabled) continue;
      const name = (s.label || "Guest").replace(/^Share:\s*/i, "").trim() || "Guest";
      const id = name.replace(/\s+/g, "-").toLowerCase().slice(0, 40);
      if (!people.has(id)) {
        people.set(id, {
          id,
          name,
          source: s.permission === "write" ? "Editor link" : "Viewer link",
        });
      }
    }

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .take(200);
    for (const c of comments) {
      const name = c.authorName.trim();
      if (!name) continue;
      const id = name.replace(/\s+/g, "-").toLowerCase().slice(0, 40);
      if (!people.has(id)) {
        people.set(id, { id, name, source: "Commenter" });
      }
      for (const mid of c.mentionIds ?? []) {
        if (!people.has(mid)) {
          people.set(mid, { id: mid, name: mid, source: "Mentioned" });
        }
      }
    }

    const memberships = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
    for (const m of memberships) {
      if (m.kind !== "team") continue;
      const peers = await ctx.db
        .query("workspaces")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", m.workspaceId))
        .collect();
      for (const p of peers) {
        if (p.ownerId === args.ownerId) continue;
        if (!people.has(p.ownerId)) {
          people.set(p.ownerId, {
            id: p.ownerId,
            name: p.name || "Teammate",
            source: `Workspace · ${p.role ?? "member"}`,
          });
        }
      }
    }

    return [...people.values()].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 40);
  },
});
