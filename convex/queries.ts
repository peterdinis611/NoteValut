import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwner } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

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

function startOfDay(ms = Date.now()) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Run a query string against the vault (client can also evaluate locally). */
export const run = query({
  args: {
    ownerId: v.string(),
    query: v.optional(v.string()),
    savedId: v.optional(v.id("savedQueries")),
    folderId: v.optional(v.id("notes")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const limit = Math.min(args.limit ?? 40, 100);

    let queryText = (args.query ?? "").trim();
    let folderId = args.folderId;
    let viewMode: string | undefined;
    if (args.savedId) {
      const saved = await ctx.db.get(args.savedId);
      if (!saved || saved.ownerId !== args.ownerId) throw new Error("Saved query not found");
      queryText = saved.query;
      folderId = folderId ?? saved.folderId;
      viewMode = saved.viewMode;
    }

    const q = queryText.toLowerCase();

    let notes = await ctx.db
      .query("notes")
      .withIndex("by_owner", (q2) => q2.eq("ownerId", args.ownerId))
      .collect();
    notes = notes.filter((n) => !n.trashed && n.kind !== "folder" && !n.archived);

    if (folderId) {
      notes = notes.filter((n) => n.parentId === folderId);
    }

    // Tokens: status:X tag:Y #y prop:key=val prop:key>val due:today|week|overdue assignee:me|id related:noteId text…
    const statusM = q.match(/status:(\S+)/);
    const tagMs = [...q.matchAll(/(?:tag:|#)(\S+)/g)].map((m) => m[1]!);
    const propEq = [...q.matchAll(/prop:([^=\s><!]+)=(\S+)/g)];
    const propGt = [...q.matchAll(/prop:([^=\s><!]+)>(\S+)/g)];
    const propLt = [...q.matchAll(/prop:([^=\s><!]+)<(\S+)/g)];
    const dueM = q.match(/due:(today|week|overdue|none)/);
    const assigneeM = q.match(/assignee:(\S+)/);
    const relatedM = q.match(/related:(\S+)/);
    const text = q
      .replace(/status:\S+/g, "")
      .replace(/(?:tag:|#)\S+/g, "")
      .replace(/prop:[^=\s><!]+[=><]\S+/g, "")
      .replace(/due:\S+/g, "")
      .replace(/assignee:\S+/g, "")
      .replace(/related:\S+/g, "")
      .trim();

    const day0 = startOfDay();
    const weekEnd = day0 + 7 * 86_400_000;

    const hits = notes.filter((n) => {
      if (statusM && (n.status || "").toLowerCase() !== statusM[1]) return false;
      for (const t of tagMs) {
        if (!(n.tags ?? []).some((x) => x.toLowerCase() === t)) return false;
      }
      const props = (n.properties ?? {}) as Record<string, unknown>;
      for (const m of propEq) {
        const val = props[m[1]!];
        if (String(val ?? "").toLowerCase() !== m[2]!.toLowerCase()) return false;
      }
      for (const m of propGt) {
        const val = Number(props[m[1]!]);
        const cmp = Number(m[2]);
        if (!Number.isFinite(val) || !Number.isFinite(cmp) || !(val > cmp)) return false;
      }
      for (const m of propLt) {
        const val = Number(props[m[1]!]);
        const cmp = Number(m[2]);
        if (!Number.isFinite(val) || !Number.isFinite(cmp) || !(val < cmp)) return false;
      }
      if (dueM) {
        const raw = props.due;
        const ms =
          typeof raw === "number"
            ? raw
            : typeof raw === "string"
              ? Date.parse(raw)
              : Number.NaN;
        if (dueM[1] === "none") {
          if (Number.isFinite(ms)) return false;
        } else if (!Number.isFinite(ms)) {
          return false;
        } else if (dueM[1] === "today") {
          if (ms < day0 || ms >= day0 + 86_400_000) return false;
        } else if (dueM[1] === "week") {
          if (ms < day0 || ms >= weekEnd) return false;
        } else if (dueM[1] === "overdue") {
          if (ms >= day0) return false;
        }
      }
      if (assigneeM) {
        const a = String(props.assignee ?? "").toLowerCase();
        const want = assigneeM[1]!;
        if (want === "me") {
          if (a !== args.ownerId.toLowerCase()) return false;
        } else if (a !== want) {
          return false;
        }
      }
      if (relatedM) {
        const rel = props;
        let found = false;
        for (const v of Object.values(rel)) {
          if (Array.isArray(v) && v.some((x) => String(x) === relatedM[1])) found = true;
          if (String(v) === relatedM[1]) found = true;
        }
        if (!found) return false;
      }
      if (text) {
        const hay = (n.searchText || `${n.title} ${n.content}`).toLowerCase();
        if (!hay.includes(text)) return false;
      }
      return true;
    });

    return {
      viewMode,
      folderId: folderId as Id<"notes"> | undefined,
      results: hits
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
        })),
    };
  },
});
