import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import {
  filterGoogleFonts,
  fontKeyToVariant,
  type GoogleFontItem,
  normalizeFontCategory,
} from "./lib/googleFonts";
import { consumeRateLimit, formatRetryAfter } from "./lib/rateLimit";

const METADATA_URL = "https://fonts.google.com/metadata/fonts";
const CACHE_KEY = "catalog";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 12_000;

/** Per authenticated user — catalog refresh attempts. */
const USER_ENSURE_LIMIT = 6;
const USER_ENSURE_WINDOW_MS = 60_000;
/** Global — protect upstream from stampedes. */
const GLOBAL_FETCH_LIMIT = 20;
const GLOBAL_FETCH_WINDOW_MS = 60_000;

const fontItemValidator = v.object({
  family: v.string(),
  category: v.string(),
  variants: v.array(v.string()),
  subsets: v.array(v.string()),
  popularity: v.optional(v.number()),
});

const listArgs = {
  q: v.optional(v.string()),
  category: v.optional(v.string()),
  sort: v.optional(v.union(v.literal("popularity"), v.literal("alpha"))),
  limit: v.optional(v.number()),
};

export type GoogleFontsErrorCode =
  | "auth"
  | "rate_limited"
  | "upstream"
  | "timeout"
  | "parse"
  | "unknown";

type MetadataFamily = {
  family?: string;
  category?: string;
  subsets?: string[];
  fonts?: Record<string, unknown>;
  popularity?: number;
};

type MetadataPayload = {
  familyMetadataList?: MetadataFamily[];
};

function parseMetadataJson(raw: string): MetadataPayload {
  let text = raw.trim();
  if (text.startsWith(")]}'")) {
    text = text.slice(4).trim();
  }
  return JSON.parse(text) as MetadataPayload;
}

function mapMetadataFamily(item: MetadataFamily): GoogleFontItem | null {
  if (!item.family) return null;
  const variants = Object.keys(item.fonts ?? {}).map(fontKeyToVariant);
  return {
    family: item.family,
    category: normalizeFontCategory(item.category ?? "sans-serif"),
    variants: variants.length > 0 ? variants : ["regular"],
    subsets: (item.subsets ?? []).filter((s) => s !== "menu"),
    popularity: item.popularity,
  };
}

class FontsFetchError extends Error {
  code: GoogleFontsErrorCode;
  constructor(code: GoogleFontsErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

async function fetchCatalog(): Promise<GoogleFontItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(METADATA_URL, {
      signal: controller.signal,
      headers: {
        Accept: "application/json,text/plain,*/*",
        "User-Agent": "NoteVault/1.0 (Convex Google Fonts)",
      },
    });
    if (!res.ok) {
      throw new FontsFetchError(
        "upstream",
        `Google Fonts unavailable (${res.status}). Try again later.`,
      );
    }
    let data: MetadataPayload;
    try {
      data = parseMetadataJson(await res.text());
    } catch {
      throw new FontsFetchError("parse", "Couldn’t parse Google Fonts catalog.");
    }
    const items = (data.familyMetadataList ?? [])
      .map(mapMetadataFamily)
      .filter((item): item is GoogleFontItem => item !== null);
    if (items.length === 0) {
      throw new FontsFetchError("upstream", "Google Fonts catalog was empty.");
    }
    return items;
  } catch (err) {
    if (err instanceof FontsFetchError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new FontsFetchError("timeout", "Google Fonts request timed out.");
    }
    throw new FontsFetchError(
      "unknown",
      err instanceof Error ? err.message : "Failed to load Google Fonts",
    );
  } finally {
    clearTimeout(timer);
  }
}

function sliceCatalog(
  catalog: GoogleFontItem[],
  args: {
    q?: string;
    category?: string;
    sort?: "popularity" | "alpha";
    limit?: number;
  },
) {
  const limit = Math.min(80, Math.max(1, args.limit ?? 40));
  const sort = args.sort ?? "popularity";
  const q = args.q ?? "";
  const category = args.category ?? "";

  const all = [...catalog];
  if (sort === "alpha") {
    all.sort((a, b) => a.family.localeCompare(b.family));
  } else {
    all.sort((a, b) => (a.popularity ?? 99999) - (b.popularity ?? 99999));
  }

  const items = filterGoogleFonts(all, q, { category, limit });
  const total = category
    ? all.filter((item) => normalizeFontCategory(item.category) === normalizeFontCategory(category))
        .length
    : all.length;

  return { items, total };
}

export const getCache = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("googleFontsCache")
      .withIndex("by_key", (q) => q.eq("key", CACHE_KEY))
      .unique();
  },
});

export const setCache = internalMutation({
  args: {
    items: v.array(fontItemValidator),
    fetchedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("googleFontsCache")
      .withIndex("by_key", (q) => q.eq("key", CACHE_KEY))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        items: args.items,
        fetchedAt: args.fetchedAt,
      });
      return;
    }
    await ctx.db.insert("googleFontsCache", {
      key: CACHE_KEY,
      items: args.items,
      fetchedAt: args.fetchedAt,
    });
  },
});

/** Reserve capacity before an expensive metadata fetch. */
export const consumeEnsureBudget = internalMutation({
  args: { userKey: v.string() },
  handler: async (ctx, args) => {
    const user = await consumeRateLimit(ctx, {
      key: `googleFonts:ensure:user:${args.userKey}`,
      limit: USER_ENSURE_LIMIT,
      windowMs: USER_ENSURE_WINDOW_MS,
    });
    if (!user.ok) {
      return {
        ok: false as const,
        code: "rate_limited" as const,
        retryAfterMs: user.retryAfterMs,
        scope: "user" as const,
      };
    }

    const global = await consumeRateLimit(ctx, {
      key: "googleFonts:ensure:global",
      limit: GLOBAL_FETCH_LIMIT,
      windowMs: GLOBAL_FETCH_WINDOW_MS,
    });
    if (!global.ok) {
      return {
        ok: false as const,
        code: "rate_limited" as const,
        retryAfterMs: global.retryAfterMs,
        scope: "global" as const,
      };
    }

    return { ok: true as const };
  },
});

export type SearchGoogleFontsResult =
  | {
      ready: false;
      items: [];
      total: 0;
      source: "none";
      stale?: boolean;
    }
  | {
      ready: true;
      items: GoogleFontItem[];
      total: number;
      source: "cache";
      fetchedAt: number;
      stale: boolean;
    };

/**
 * Reactive search over the cached catalog.
 * Works with `useQuery`, `preloadQuery`, and `fetchQuery` (RSC / client).
 * Returns `ready: false` when the catalog still needs `ensure`.
 */
export const search = query({
  args: listArgs,
  handler: async (ctx, args): Promise<SearchGoogleFontsResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const cached = await ctx.db
      .query("googleFontsCache")
      .withIndex("by_key", (q) => q.eq("key", CACHE_KEY))
      .unique();

    if (!cached) {
      return { ready: false, items: [], total: 0, source: "none" };
    }

    const stale = Date.now() - cached.fetchedAt >= CACHE_TTL_MS;
    const { items, total } = sliceCatalog(cached.items, args);
    return {
      ready: true,
      items,
      total,
      source: "cache",
      fetchedAt: cached.fetchedAt,
      stale,
    };
  },
});

export type EnsureGoogleFontsResult =
  | { ok: true; source: "cache" | "metadata" | "stale" }
  | {
      ok: false;
      code: GoogleFontsErrorCode;
      error: string;
      retryAfterMs?: number;
    };

/**
 * Warm / refresh the Google Fonts catalog cache (HTTP fetch).
 * Rate-limited per user + globally. Serves stale cache when limited/upstream fails.
 */
export const ensure = action({
  args: {
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<EnsureGoogleFontsResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { ok: false, code: "auth", error: "Not authenticated" };
    }

    try {
      const cached = await ctx.runQuery(internal.googleFonts.getCache, {});
      const fresh =
        cached && !args.force && Date.now() - cached.fetchedAt < CACHE_TTL_MS ? cached : null;

      if (fresh) {
        return { ok: true, source: "cache" };
      }

      const budget = await ctx.runMutation(internal.googleFonts.consumeEnsureBudget, {
        userKey: identity.subject,
      });

      if (!budget.ok) {
        if (cached) {
          // Soft-fail: keep serving yesterday's catalog.
          return { ok: true, source: "stale" };
        }
        return {
          ok: false,
          code: "rate_limited",
          error: `Too many font catalog refreshes. Retry in ${formatRetryAfter(budget.retryAfterMs)}.`,
          retryAfterMs: budget.retryAfterMs,
        };
      }

      try {
        const catalog = await fetchCatalog();
        await ctx.runMutation(internal.googleFonts.setCache, {
          items: catalog,
          fetchedAt: Date.now(),
        });
        return { ok: true, source: "metadata" };
      } catch (err) {
        if (cached) {
          return { ok: true, source: "stale" };
        }
        if (err instanceof FontsFetchError) {
          return { ok: false, code: err.code, error: err.message };
        }
        return {
          ok: false,
          code: "unknown",
          error: err instanceof Error ? err.message : "Failed to load Google Fonts",
        };
      }
    } catch (err) {
      return {
        ok: false,
        code: "unknown",
        error: err instanceof Error ? err.message : "Failed to load Google Fonts",
      };
    }
  },
});

export type ListGoogleFontsResult = {
  items: GoogleFontItem[];
  total: number;
  source: "cache" | "metadata" | "stale";
  error?: string;
  code?: GoogleFontsErrorCode;
  retryAfterMs?: number;
};

/** One-shot list (ensure + search). Prefer `search` + `ensure` for Suspense/preload. */
export const list = action({
  args: listArgs,
  handler: async (ctx, args): Promise<ListGoogleFontsResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        items: [],
        total: 0,
        source: "cache",
        error: "Not authenticated",
        code: "auth",
      };
    }

    const ensureResult = await (async (): Promise<EnsureGoogleFontsResult> => {
      const cached = await ctx.runQuery(internal.googleFonts.getCache, {});
      const fresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS ? cached : null;
      if (fresh) return { ok: true, source: "cache" };

      const budget = await ctx.runMutation(internal.googleFonts.consumeEnsureBudget, {
        userKey: identity.subject,
      });
      if (!budget.ok) {
        if (cached) return { ok: true, source: "stale" };
        return {
          ok: false,
          code: "rate_limited",
          error: `Too many font catalog refreshes. Retry in ${formatRetryAfter(budget.retryAfterMs)}.`,
          retryAfterMs: budget.retryAfterMs,
        };
      }

      try {
        const catalog = await fetchCatalog();
        await ctx.runMutation(internal.googleFonts.setCache, {
          items: catalog,
          fetchedAt: Date.now(),
        });
        return { ok: true, source: "metadata" };
      } catch (err) {
        if (cached) return { ok: true, source: "stale" };
        if (err instanceof FontsFetchError) {
          return { ok: false, code: err.code, error: err.message };
        }
        return {
          ok: false,
          code: "unknown",
          error: err instanceof Error ? err.message : "Failed to load Google Fonts",
        };
      }
    })();

    if (!ensureResult.ok) {
      return {
        items: [],
        total: 0,
        source: "cache",
        error: ensureResult.error,
        code: ensureResult.code,
        retryAfterMs: ensureResult.retryAfterMs,
      };
    }

    const cached = await ctx.runQuery(internal.googleFonts.getCache, {});
    if (!cached) {
      return {
        items: [],
        total: 0,
        source: "cache",
        error: "Catalog still empty",
        code: "upstream",
      };
    }

    const { items, total } = sliceCatalog(cached.items, args);
    return { items, total, source: ensureResult.source };
  },
});
