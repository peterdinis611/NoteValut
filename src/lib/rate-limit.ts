import "server-only";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: number;
};

export type RateLimitOptions = {
  /** Logical bucket name (e.g. "api:appwrite:post"). */
  name: string;
  /** Max requests allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

const CLEANUP_EVERY = 200;
let hitsSinceCleanup = 0;

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Default limits — override via env when deploying (read at call time). */
export const rateLimitPresets = {
  get apiGet() {
    return {
      limit: envInt("RATE_LIMIT_API_GET_MAX", 120),
      windowMs: envInt("RATE_LIMIT_API_WINDOW_MS", 60_000),
    };
  },
  get apiPost() {
    return {
      limit: envInt("RATE_LIMIT_API_POST_MAX", 40),
      windowMs: envInt("RATE_LIMIT_API_WINDOW_MS", 60_000),
    };
  },
  get auth() {
    return {
      limit: envInt("RATE_LIMIT_AUTH_MAX", 15),
      windowMs: envInt("RATE_LIMIT_AUTH_WINDOW_MS", 60_000),
    };
  },
};

function cleanup(now: number) {
  hitsSinceCleanup += 1;
  if (hitsSinceCleanup < CLEANUP_EVERY) return;
  hitsSinceCleanup = 0;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

/**
 * Fixed-window counter rate limiter (per process / instance).
 * Fine for a single Node `next start`; use Redis/Upstash when you scale out.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const storeKey = `${options.name}:${key}`;
  let bucket = store.get(storeKey);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + options.windowMs };
    store.set(storeKey, bucket);
  }

  bucket.count += 1;

  const remaining = Math.max(0, options.limit - bucket.count);
  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  return {
    success: bucket.count <= options.limit,
    limit: options.limit,
    remaining,
    reset: bucket.resetAt,
    retryAfter,
  };
}

/** Best-effort client IP for rate-limit keys. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;

  return "unknown";
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
    ...(result.success
      ? {}
      : { "Retry-After": String(result.retryAfter) }),
  };
}

export function rateLimitedResponse(result: RateLimitResult): Response {
  return Response.json(
    {
      error: "Too many requests",
      message: "Rate limit exceeded. Try again later.",
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    },
  );
}

type RouteHandler = (request: Request) => Promise<Response> | Response;

/**
 * Wrap a route handler with IP-based rate limiting.
 * On success, rate-limit headers are merged onto the upstream response.
 */
export function withRateLimit(
  handler: RouteHandler,
  resolveOptions: (request: Request) => RateLimitOptions,
): RouteHandler {
  return async (request) => {
    const options = resolveOptions(request);
    const result = checkRateLimit(getClientIp(request), options);

    if (!result.success) {
      return rateLimitedResponse(result);
    }

    const response = await handler(request);
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(rateLimitHeaders(result))) {
      headers.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

/** Paths that look like auth / session mutations — tighter bucket. */
export function isAuthSensitivePath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return (
    path.includes("session") ||
    path.includes("account") ||
    path.includes("oauth") ||
    path.includes("token") ||
    path.includes("password") ||
    path.includes("verification") ||
    path.includes("recovery") ||
    path.includes("jwt") ||
    path.includes("mfa")
  );
}
