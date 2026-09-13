import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { blockValidator } from "./block";

export default defineSchema({
  notes: defineTable({
    ownerId: v.string(),
    title: v.string(),
    content: v.string(),
    blocks: v.optional(v.array(blockValidator)),
    folderBlocks: v.optional(v.array(blockValidator)),
    icon: v.string(),
    coverColor: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    parentId: v.optional(v.id("notes")),
    /** Manual sidebar order among siblings (lower = higher in list) */
    sortOrder: v.optional(v.number()),
    kind: v.optional(v.union(v.literal("page"), v.literal("folder"))),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
    viewMode: v.optional(
      v.union(v.literal("grid"), v.literal("list"), v.literal("table"), v.literal("gallery")),
    ),
    sortMode: v.optional(v.union(v.literal("updated"), v.literal("name"), v.literal("kind"))),
    defaultTemplateId: v.optional(v.string()),
    isLocked: v.optional(v.boolean()),
    /** Optional status for database-style views */
    status: v.optional(v.string()),
    pinned: v.boolean(),
    archived: v.boolean(),
    trashed: v.optional(v.boolean()),
    trashedAt: v.optional(v.number()),
    tags: v.array(v.string()),
    /** YYYY-MM-DD when this note is a daily note */
    dailyKey: v.optional(v.string()),
    /** Denormalized full-text field for Convex searchIndex */
    searchText: v.optional(v.string()),
    /** Optional page-scoped Google Font / CSS font */
    fontFamily: v.optional(v.string()),
    fontUrl: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_updated", ["ownerId", "updatedAt"])
    .index("by_parent", ["parentId"])
    .index("by_owner_daily", ["ownerId", "dailyKey"])
    .searchIndex("search_body", {
      searchField: "searchText",
      filterFields: ["ownerId"],
    }),

  noteVersions: defineTable({
    noteId: v.id("notes"),
    ownerId: v.string(),
    title: v.string(),
    content: v.string(),
    blocks: v.optional(v.array(blockValidator)),
    tags: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_note", ["noteId", "createdAt"])
    .index("by_owner", ["ownerId"]),

  vaultSettings: defineTable({
    ownerId: v.string(),
    sharingEnabled: v.boolean(),
    publicReadonly: v.boolean(),
    /** Optional full-bleed background on vault home */
    backgroundImage: v.optional(v.string()),
    /** Auto-open/create today’s daily note on vault load */
    autoDailyNote: v.optional(v.boolean()),
    /** Default daily reminder time "HH:mm" local — used with recurrence */
    dailyReminderTime: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  shares: defineTable({
    ownerId: v.string(),
    token: v.string(),
    scope: v.union(v.literal("vault"), v.literal("collection"), v.literal("entry")),
    noteId: v.optional(v.id("notes")),
    permission: v.union(v.literal("read"), v.literal("write")),
    label: v.string(),
    enabled: v.boolean(),
    createdAt: v.number(),
    /** Optional expiry (ms epoch). */
    expiresAt: v.optional(v.number()),
    /** SHA-256 hex of `token:password` when password-protected. */
    passwordHash: v.optional(v.string()),
    viewCount: v.optional(v.number()),
    lastViewedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_owner", ["ownerId"]),

  /** Calendar / daily reminders — fired while the app is open via client listener. */
  reminders: defineTable({
    ownerId: v.string(),
    dailyKey: v.string(),
    noteId: v.optional(v.id("notes")),
    title: v.string(),
    remindAt: v.number(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("fired"),
      v.literal("dismissed"),
      v.literal("cancelled"),
    ),
    jobId: v.optional(v.id("_scheduled_functions")),
    createdAt: v.number(),
    firedAt: v.optional(v.number()),
    /** Recurrence: none | daily | weekly */
    recurrence: v.optional(
      v.union(v.literal("none"), v.literal("daily"), v.literal("weekly")),
    ),
  })
    .index("by_owner_status", ["ownerId", "status"])
    .index("by_owner_daily", ["ownerId", "dailyKey"])
    .index("by_owner_remindAt", ["ownerId", "remindAt"]),

  /** Web Push subscriptions for calendar reminders when the app is closed. */
  pushSubscriptions: defineTable({
    ownerId: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_endpoint", ["endpoint"]),

  /** Cached Google Fonts catalog (public metadata, refreshed daily). */
  googleFontsCache: defineTable({
    key: v.string(),
    fetchedAt: v.number(),
    items: v.array(
      v.object({
        family: v.string(),
        category: v.string(),
        variants: v.array(v.string()),
        subsets: v.array(v.string()),
        popularity: v.optional(v.number()),
      }),
    ),
  }).index("by_key", ["key"]),

  /** Fixed-window rate limits (e.g. googleFonts.ensure). */
  rateLimits: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
  }).index("by_key", ["key"]),

  /** Notion-style public published pages (SEO + custom slug). */
  publications: defineTable({
    ownerId: v.string(),
    noteId: v.id("notes"),
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    ogImage: v.optional(v.string()),
    published: v.boolean(),
    publishedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerId"])
    .index("by_note", ["noteId"]),

  /** Synced / transcluded block content shared across pages. */
  syncedBlocks: defineTable({
    ownerId: v.string(),
    key: v.string(),
    text: v.string(),
    label: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_owner_key", ["ownerId", "key"])
    .index("by_owner", ["ownerId"]),

  /** Page comments with optional @mentions. */
  comments: defineTable({
    ownerId: v.string(),
    noteId: v.id("notes"),
    authorId: v.string(),
    authorName: v.string(),
    body: v.string(),
    mentionIds: v.optional(v.array(v.string())),
    blockId: v.optional(v.string()),
    resolved: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_note", ["noteId", "createdAt"])
    .index("by_owner", ["ownerId"]),

  /** Writing streak / focus stats (per owner). */
  vaultStats: defineTable({
    ownerId: v.string(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastActiveDay: v.optional(v.string()),
    totalFocusMinutes: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),
});
