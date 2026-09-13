import type { MutationCtx } from "../_generated/server";

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterMs: number; remaining: 0 };

/**
 * Fixed-window rate limit stored in `rateLimits`.
 * Call only from mutations (transactional).
 */
export async function consumeRateLimit(
  ctx: MutationCtx,
  opts: {
    key: string;
    limit: number;
    windowMs: number;
  },
): Promise<RateLimitResult> {
  const now = Date.now();
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", opts.key))
    .unique();

  if (!existing || now - existing.windowStart >= opts.windowMs) {
    if (existing) {
      await ctx.db.patch(existing._id, { windowStart: now, count: 1 });
    } else {
      await ctx.db.insert("rateLimits", {
        key: opts.key,
        windowStart: now,
        count: 1,
      });
    }
    return { ok: true, remaining: opts.limit - 1 };
  }

  if (existing.count >= opts.limit) {
    const retryAfterMs = Math.max(0, existing.windowStart + opts.windowMs - now);
    return { ok: false, retryAfterMs, remaining: 0 };
  }

  await ctx.db.patch(existing._id, { count: existing.count + 1 });
  return { ok: true, remaining: opts.limit - existing.count - 1 };
}

export function formatRetryAfter(ms: number): string {
  const sec = Math.max(1, Math.ceil(ms / 1000));
  if (sec < 60) return `${sec}s`;
  return `${Math.ceil(sec / 60)}m`;
}
