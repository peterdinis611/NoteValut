import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = QueryCtx | MutationCtx;

export type WorkspaceRole = "owner" | "admin" | "member";

const ROLE_RANK: Record<WorkspaceRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

/**
 * Require a signed-in Clerk user (via Convex JWT) and ensure the
 * client-supplied ownerId matches the authenticated subject.
 */
export async function requireOwner(ctx: AuthCtx, ownerId: string): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  if (identity.subject !== ownerId) {
    throw new Error("Forbidden");
  }
  return identity.subject;
}

/** Resolve caller's membership role for a workspaceId, if any. */
export async function getWorkspaceRole(
  ctx: AuthCtx,
  subject: string,
  workspaceId: string,
): Promise<WorkspaceRole | null> {
  const row = await ctx.db
    .query("workspaces")
    .withIndex("by_owner", (q) => q.eq("ownerId", subject))
    .collect();
  const hit = row.find((r) => r.workspaceId === workspaceId);
  if (!hit) return null;
  return (hit.role as WorkspaceRole | undefined) ?? "member";
}

export function roleAtLeast(have: WorkspaceRole, need: WorkspaceRole) {
  return ROLE_RANK[have] >= ROLE_RANK[need];
}

/**
 * Load a note and, when the caller is signed in, ensure they own it
 * OR are a member of its workspace (Clerk org ACL).
 * Unauthenticated callers are allowed so public share links can still
 * read/write through the UI (token gate is on the share bundle).
 */
export async function assertCanAccessNote(
  ctx: AuthCtx,
  noteId: Id<"notes">,
  opts?: { minEditRole?: WorkspaceRole },
) {
  const note = await ctx.db.get(noteId);
  if (!note) throw new Error("Not found");
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return note;

  if (note.ownerId === identity.subject) return note;

  const workspaceId = note.workspaceId;
  if (!workspaceId || workspaceId === note.ownerId) {
    throw new Error("Forbidden");
  }

  const role = await getWorkspaceRole(ctx, identity.subject, workspaceId);
  if (!role) throw new Error("Forbidden");

  if (opts?.minEditRole && !roleAtLeast(role, opts.minEditRole)) {
    const acl = await ctx.db
      .query("noteAcl")
      .withIndex("by_note", (q) => q.eq("noteId", noteId))
      .first();
    const need = acl?.minEditRole ?? opts.minEditRole;
    if (!roleAtLeast(role, need)) throw new Error("Forbidden");
  }

  return note;
}

/** Optional auth — returns subject when present, otherwise null. */
export async function getAuthSubject(ctx: AuthCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? null;
}
