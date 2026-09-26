import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const STALE_MS = 20_000;
const COLORS = ["#c4480e", "#1d4ed8", "#0f766e", "#7c2d12", "#6d28d9", "#b45309"];

function colorForSession(sessionId: string) {
  let h = 0;
  for (let i = 0; i < sessionId.length; i++) h = (h * 31 + sessionId.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length]!;
}

export const heartbeat = mutation({
  args: {
    shareToken: v.string(),
    sessionId: v.string(),
    displayName: v.string(),
    noteId: v.optional(v.string()),
    cursorBlockId: v.optional(v.string()),
    cursorX: v.optional(v.number()),
    cursorY: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_token_session", (q) =>
        q.eq("shareToken", args.shareToken).eq("sessionId", args.sessionId),
      )
      .first();

    const payload = {
      shareToken: args.shareToken,
      sessionId: args.sessionId,
      displayName: args.displayName.trim().slice(0, 40) || "Guest",
      color: colorForSession(args.sessionId),
      noteId: args.noteId,
      cursorBlockId: args.cursorBlockId,
      cursorX: args.cursorX,
      cursorY: args.cursorY,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("presence", payload);
  },
});

export const leave = mutation({
  args: { shareToken: v.string(), sessionId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_token_session", (q) =>
        q.eq("shareToken", args.shareToken).eq("sessionId", args.sessionId),
      )
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const listActive = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const rows = await ctx.db
      .query("presence")
      .withIndex("by_token", (q) => q.eq("shareToken", args.shareToken))
      .collect();
    return rows
      .filter((r) => now - r.updatedAt < STALE_MS)
      .map((r) => ({
        sessionId: r.sessionId,
        displayName: r.displayName,
        color: r.color,
        noteId: r.noteId,
        cursorBlockId: r.cursorBlockId,
        cursorX: r.cursorX,
        cursorY: r.cursorY,
        updatedAt: r.updatedAt,
      }));
  },
});
