import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = QueryCtx | MutationCtx;

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

/**
 * Load a note and, when the caller is signed in, ensure they own it.
 * Unauthenticated callers are allowed so public share links can still
 * read/write through the UI (token gate is on the share bundle).
 */
export async function assertCanAccessNote(ctx: AuthCtx, noteId: Id<"notes">) {
  const note = await ctx.db.get(noteId);
  if (!note) throw new Error("Not found");
  const identity = await ctx.auth.getUserIdentity();
  if (identity && note.ownerId !== identity.subject) {
    throw new Error("Forbidden");
  }
  return note;
}

/** Optional auth — returns subject when present, otherwise null. */
export async function getAuthSubject(ctx: AuthCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? null;
}
