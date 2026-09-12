import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwner } from "./lib/auth";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

function newToken() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

function isActive(item: { archived: boolean; trashed?: boolean }) {
  return !item.archived && !item.trashed;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashSharePassword(token: string, password: string) {
  return sha256Hex(`${token}:${password}`);
}

async function collectDescendants(ctx: QueryCtx, rootId: Id<"notes">): Promise<Doc<"notes">[]> {
  const result: Doc<"notes">[] = [];
  const queue = [rootId];

  while (queue.length) {
    const id = queue.shift()!;
    const children = await ctx.db
      .query("notes")
      .withIndex("by_parent", (q) => q.eq("parentId", id))
      .collect();

    for (const child of children) {
      if (!isActive(child)) continue;
      result.push(child);
      if (child.kind === "folder") queue.push(child._id);
    }
  }

  return result;
}

export const list = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    return await ctx.db
      .query("shares")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    ownerId: v.string(),
    scope: v.union(v.literal("vault"), v.literal("collection"), v.literal("entry")),
    noteId: v.optional(v.id("notes")),
    permission: v.union(v.literal("read"), v.literal("write")),
    label: v.optional(v.string()),
    expiresAt: v.optional(v.union(v.number(), v.null())),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    if (args.scope !== "vault" && !args.noteId) {
      throw new Error("noteId required for collection/entry shares");
    }

    if (args.noteId) {
      const note = await ctx.db.get(args.noteId);
      if (!note || note.ownerId !== args.ownerId) throw new Error("Not found");
    }

    const now = Date.now();
    const token = newToken();
    const passwordHash =
      args.password && args.password.trim()
        ? await hashSharePassword(token, args.password.trim())
        : undefined;

    return await ctx.db.insert("shares", {
      ownerId: args.ownerId,
      token,
      scope: args.scope,
      noteId: args.noteId,
      permission: args.permission,
      label: args.label ?? defaultLabel(args.scope),
      enabled: true,
      createdAt: now,
      expiresAt: args.expiresAt ?? undefined,
      passwordHash,
      viewCount: 0,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("shares"),
    ownerId: v.string(),
    permission: v.optional(v.union(v.literal("read"), v.literal("write"))),
    enabled: v.optional(v.boolean()),
    label: v.optional(v.string()),
    expiresAt: v.optional(v.union(v.number(), v.null())),
    password: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const share = await ctx.db.get(args.id);
    if (!share || share.ownerId !== args.ownerId) throw new Error("Share not found");

    const updates: Record<string, unknown> = {};
    if (args.permission !== undefined) updates.permission = args.permission;
    if (args.enabled !== undefined) updates.enabled = args.enabled;
    if (args.label !== undefined) updates.label = args.label;
    if (args.expiresAt !== undefined) updates.expiresAt = args.expiresAt ?? undefined;
    if (args.password !== undefined) {
      updates.passwordHash =
        args.password && args.password.trim()
          ? await hashSharePassword(share.token, args.password.trim())
          : undefined;
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("shares"), ownerId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const share = await ctx.db.get(args.id);
    if (!share || share.ownerId !== args.ownerId) throw new Error("Share not found");
    await ctx.db.delete(args.id);
  },
});

/** Disable or delete every share for this owner (optionally scoped to a note). */
export const revokeAll = mutation({
  args: {
    ownerId: v.string(),
    noteId: v.optional(v.id("notes")),
    hardDelete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const all = await ctx.db
      .query("shares")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();

    let count = 0;
    for (const share of all) {
      if (args.noteId) {
        if (share.scope === "vault") continue;
        if (share.noteId !== args.noteId) continue;
      }
      if (args.hardDelete) await ctx.db.delete(share._id);
      else await ctx.db.patch(share._id, { enabled: false });
      count += 1;
    }
    return { count };
  },
});

export const recordView = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const share = await ctx.db
      .query("shares")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!share || !share.enabled) return null;
    if (share.expiresAt && share.expiresAt < Date.now()) return null;
    await ctx.db.patch(share._id, {
      viewCount: (share.viewCount ?? 0) + 1,
      lastViewedAt: Date.now(),
    });
    return { viewCount: (share.viewCount ?? 0) + 1 };
  },
});

export const getSharedVault = query({
  args: {
    token: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const share = await ctx.db
      .query("shares")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!share || !share.enabled) return null;
    if (share.expiresAt && share.expiresAt < Date.now()) {
      return { expired: true as const, label: share.label };
    }

    if (share.passwordHash) {
      const ok =
        args.password &&
        (await hashSharePassword(share.token, args.password)) === share.passwordHash;
      if (!ok) {
        return {
          locked: true as const,
          label: share.label,
          token: share.token,
        };
      }
    }

    const settings = await ctx.db
      .query("vaultSettings")
      .withIndex("by_owner", (q) => q.eq("ownerId", share.ownerId))
      .first();

    let notes: Doc<"notes">[] = [];

    if (share.scope === "vault") {
      notes = await ctx.db
        .query("notes")
        .withIndex("by_owner", (q) => q.eq("ownerId", share.ownerId))
        .collect();
      notes = notes.filter(isActive);
    } else if (share.noteId) {
      const root = await ctx.db.get(share.noteId);
      if (!root || !isActive(root)) return null;
      notes = [root, ...(await collectDescendants(ctx, root._id))];
    }

    const role = share.permission === "write" ? "editor" : "viewer";
    const canWrite = role === "editor";

    return {
      share: {
        token: share.token,
        scope: share.scope,
        permission: share.permission,
        role,
        label: share.label,
        noteId: share.noteId,
        expiresAt: share.expiresAt,
        viewCount: share.viewCount ?? 0,
        lastViewedAt: share.lastViewedAt,
        passwordProtected: Boolean(share.passwordHash),
      },
      ownerId: share.ownerId,
      role,
      readOnly: !canWrite,
      settings: settings ?? { sharingEnabled: true, publicReadonly: true },
      notes,
      rootNote: share.noteId ? notes.find((n) => n._id === share.noteId) : null,
    };
  },
});

function defaultLabel(scope: "vault" | "collection" | "entry") {
  if (scope === "vault") return "Full vault link";
  if (scope === "collection") return "Collection link";
  return "Entry link";
}
