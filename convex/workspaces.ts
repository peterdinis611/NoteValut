import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwner } from "./lib/auth";

/** Ensure a personal workspace exists and list memberships. */
export const listForUser = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const rows = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
    if (rows.length === 0) {
      // Virtual personal workspace until ensurePersonal is called
      return [
        {
          workspaceId: args.ownerId,
          name: "Personal",
          kind: "personal" as const,
          role: "owner" as const,
          orgId: undefined as string | undefined,
        },
      ];
    }
    return rows.map((r) => ({
      workspaceId: r.workspaceId,
      name: r.name,
      kind: r.kind,
      role: r.role ?? "member",
      orgId: r.orgId,
    }));
  },
});

export const ensurePersonal = mutation({
  args: { ownerId: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.ownerId))
      .first();
    if (existing) return existing.workspaceId;
    await ctx.db.insert("workspaces", {
      ownerId: args.ownerId,
      workspaceId: args.ownerId,
      name: args.name?.trim() || "Personal",
      kind: "personal",
      role: "owner",
      updatedAt: Date.now(),
    });
    return args.ownerId;
  },
});

/** Link a Clerk Organization as a team workspace (foundation). */
export const linkOrg = mutation({
  args: {
    ownerId: v.string(),
    orgId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const workspaceId = `org:${args.orgId}`;
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name.trim() || existing.name,
        updatedAt: Date.now(),
      });
      return workspaceId;
    }
    await ctx.db.insert("workspaces", {
      ownerId: args.ownerId,
      workspaceId,
      name: args.name.trim() || "Team",
      kind: "team",
      orgId: args.orgId,
      role: "owner",
      updatedAt: Date.now(),
    });
    return workspaceId;
  },
});

export const setActive = mutation({
  args: { ownerId: v.string(), workspaceId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const settings = await ctx.db
      .query("vaultSettings")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();
    if (settings) {
      await ctx.db.patch(settings._id, {
        activeWorkspaceId: args.workspaceId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("vaultSettings", {
        ownerId: args.ownerId,
        sharingEnabled: false,
        publicReadonly: true,
        activeWorkspaceId: args.workspaceId,
        updatedAt: Date.now(),
      });
    }
    return args.workspaceId;
  },
});

/** Invite a Clerk user (by subject id) into a team workspace with a role. */
export const inviteMember = mutation({
  args: {
    ownerId: v.string(),
    workspaceId: v.string(),
    memberUserId: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const mine = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
    const ws = mine.find((r) => r.workspaceId === args.workspaceId);
    if (!ws || ws.kind !== "team") throw new Error("Team workspace not found");
    if (ws.role !== "owner" && ws.role !== "admin") throw new Error("Only owners/admins can invite");

    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.memberUserId))
      .collect();
    const hit = existing.find((r) => r.workspaceId === args.workspaceId);
    if (hit) {
      await ctx.db.patch(hit._id, {
        role: args.role,
        name: args.displayName?.trim() || hit.name,
        updatedAt: Date.now(),
      });
      return hit._id;
    }
    return await ctx.db.insert("workspaces", {
      ownerId: args.memberUserId,
      workspaceId: args.workspaceId,
      name: args.displayName?.trim() || ws.name,
      kind: "team",
      orgId: ws.orgId,
      role: args.role,
      updatedAt: Date.now(),
    });
  },
});

/** Set per-note edit ACL for org-shared notes. */
export const setNoteAcl = mutation({
  args: {
    ownerId: v.string(),
    noteId: v.id("notes"),
    minEditRole: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const note = await ctx.db.get(args.noteId);
    if (!note || note.ownerId !== args.ownerId) throw new Error("Not found");
    const workspaceId = note.workspaceId ?? args.ownerId;
    const existing = await ctx.db
      .query("noteAcl")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        minEditRole: args.minEditRole,
        workspaceId,
        updatedAt: Date.now(),
      });
      return existing._id;
    }
    return await ctx.db.insert("noteAcl", {
      noteId: args.noteId,
      workspaceId,
      minEditRole: args.minEditRole,
      updatedAt: Date.now(),
    });
  },
});

export const listMembers = query({
  args: { ownerId: v.string(), workspaceId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const mine = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
    if (!mine.some((r) => r.workspaceId === args.workspaceId)) return [];
    const rows = await ctx.db
      .query("workspaces")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    return rows.map((r) => ({
      userId: r.ownerId,
      name: r.name,
      role: r.role ?? "member",
    }));
  },
});
