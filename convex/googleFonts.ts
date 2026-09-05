import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import {
  filterGoogleFonts,
  fontKeyToVariant,
  type GoogleFontItem,
  normalizeFontCategory,
} from "./lib/googleFonts";

const METADATA_URL = "https://fonts.google.com/metadata/fonts";
const CACHE_KEY = "catalog";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

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

async function fetchCatalog(): Promise<GoogleFontItem[]> {
  const res = await fetch(METADATA_URL, {
    headers: {
      Accept: "application/json,text/plain,*/*",
      "User-Agent": "NoteVault/1.0 (Convex Google Fonts)",
    },
  });
  if (!res.ok) {
    throw new Error(`Google Fonts metadata error (${res.status})`);
  }
  const data = parseMetadataJson(await res.text());
  return (data.familyMetadataList ?? [])
    .map(mapMetadataFamily)
    .filter((item): item is GoogleFontItem => item !== null);
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
    ? all.filter(
        (item) =>
          normalizeFontCategory(item.category) === normalizeFontCategory(category),
      ).length
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

/**
 * Warm / refresh the Google Fonts catalog cache (HTTP fetch).
 * Call from client or server (`fetchAction`) when `search` reports not ready / stale.
 */
export const ensure = action({
  args: {
    force: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ ok: true; source: "cache" | "metadata" } | { ok: false; error: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { ok: false, error: "Not authenticated" };
    }

    try {
      const cached = await ctx.runQuery(internal.googleFonts.getCache, {});
      const fresh =
        cached && !args.force && Date.now() - cached.fetchedAt < CACHE_TTL_MS
          ? cached
          : null;

      if (fresh) {
        return { ok: true, source: "cache" };
      }

      const catalog = await fetchCatalog();
      await ctx.runMutation(internal.googleFonts.setCache, {
        items: catalog,
        fetchedAt: Date.now(),
      });
      return { ok: true, source: "metadata" };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to load Google Fonts",
      };
    }
  },
});

export type ListGoogleFontsResult = {
  items: GoogleFontItem[];
  total: number;
  source: "cache" | "metadata";
  error?: string;
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
      };
    }

    try {
      const cached = await ctx.runQuery(internal.googleFonts.getCache, {});
      const fresh =
        cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS ? cached : null;

      let catalog: GoogleFontItem[];
      let source: "cache" | "metadata";

      if (fresh) {
        catalog = fresh.items;
        source = "cache";
      } else {
        catalog = await fetchCatalog();
        await ctx.runMutation(internal.googleFonts.setCache, {
          items: catalog,
          fetchedAt: Date.now(),
        });
        source = "metadata";
      }

      const { items, total } = sliceCatalog(catalog, args);
      return { items, total, source };
    } catch (err) {
      return {
        items: [],
        total: 0,
        source: "cache",
        error: err instanceof Error ? err.message : "Failed to load Google Fonts",
      };
    }
  },
});
