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
