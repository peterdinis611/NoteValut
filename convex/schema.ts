import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { blockValidator } from "./block";
import { propertyDefValidator, viewConfigValidator } from "./lib/properties";

export default defineSchema({
  notes: defineTable({
    ownerId: v.string(),
    workspaceId: v.optional(v.string()),
    title: v.string(),
    content: v.string(),
    blocks: v.optional(v.array(blockValidator)),
    folderBlocks: v.optional(v.array(blockValidator)),
    icon: v.string(),
    coverColor: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    parentId: v.optional(v.id("notes")),
    sortOrder: v.optional(v.number()),
    kind: v.optional(v.union(v.literal("page"), v.literal("folder"))),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
    viewMode: v.optional(
      v.union(
        v.literal("grid"),
        v.literal("list"),
        v.literal("table"),
        v.literal("gallery"),
        v.literal("kanban"),
      ),
    ),
    sortMode: v.optional(v.union(v.literal("updated"), v.literal("name"), v.literal("kind"))),
    defaultTemplateId: v.optional(v.string()),
    isLocked: v.optional(v.boolean()),
    status: v.optional(v.string()),
    propertyDefs: v.optional(v.array(propertyDefValidator)),
    properties: v.optional(v.any()),
    viewConfig: v.optional(viewConfigValidator),
    pinned: v.boolean(),
    archived: v.boolean(),
    trashed: v.optional(v.boolean()),
    trashedAt: v.optional(v.number()),
    tags: v.array(v.string()),
    dailyKey: v.optional(v.string()),
    searchText: v.optional(v.string()),
    embedding: v.optional(v.array(v.float64())),
    fontFamily: v.optional(v.string()),
    fontUrl: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_updated", ["ownerId", "updatedAt"])
    .index("by_parent", ["parentId"])
    .index("by_owner_daily", ["ownerId", "dailyKey"])
    .index("by_workspace", ["workspaceId"])
    .searchIndex("search_body", {
      searchField: "searchText",
      filterFields: ["ownerId"],
    })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 384,
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
    label: v.optional(v.string()),
  })
    .index("by_note", ["noteId", "createdAt"])
    .index("by_owner", ["ownerId"]),

  vaultSettings: defineTable({
    ownerId: v.string(),
    sharingEnabled: v.boolean(),
    publicReadonly: v.boolean(),
    backgroundImage: v.optional(v.string()),
    autoDailyNote: v.optional(v.boolean()),
    dailyReminderTime: v.optional(v.string()),
    trashRetentionDays: v.optional(v.number()),
    homeWidgets: v.optional(v.array(v.string())),
    activeWorkspaceId: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  workspaces: defineTable({
    ownerId: v.string(),
    workspaceId: v.string(),
    name: v.string(),
    kind: v.union(v.literal("personal"), v.literal("team")),
    orgId: v.optional(v.string()),
    role: v.optional(v.union(v.literal("owner"), v.literal("admin"), v.literal("member"))),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_workspace", ["workspaceId"])
    .index("by_org", ["orgId"]),

  shares: defineTable({
    ownerId: v.string(),
    token: v.string(),
    scope: v.union(v.literal("vault"), v.literal("collection"), v.literal("entry")),
    noteId: v.optional(v.id("notes")),
    permission: v.union(v.literal("read"), v.literal("write")),
    label: v.string(),
    enabled: v.boolean(),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    passwordHash: v.optional(v.string()),
    viewCount: v.optional(v.number()),
    lastViewedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_owner", ["ownerId"]),

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
    recurrence: v.optional(
      v.union(v.literal("none"), v.literal("daily"), v.literal("weekly")),
    ),
  })
    .index("by_owner_status", ["ownerId", "status"])
    .index("by_owner_daily", ["ownerId", "dailyKey"])
    .index("by_owner_remindAt", ["ownerId", "remindAt"]),

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

  rateLimits: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
  }).index("by_key", ["key"]),

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

  syncedBlocks: defineTable({
    ownerId: v.string(),
    key: v.string(),
    text: v.string(),
    label: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_owner_key", ["ownerId", "key"])
    .index("by_owner", ["ownerId"]),

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

  vaultStats: defineTable({
    ownerId: v.string(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastActiveDay: v.optional(v.string()),
    totalFocusMinutes: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  presence: defineTable({
    shareToken: v.string(),
    sessionId: v.string(),
    displayName: v.string(),
    color: v.string(),
    noteId: v.optional(v.string()),
    cursorBlockId: v.optional(v.string()),
    cursorX: v.optional(v.number()),
    cursorY: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_token", ["shareToken"])
    .index("by_token_session", ["shareToken", "sessionId"]),

  savedQueries: defineTable({
    ownerId: v.string(),
    folderId: v.optional(v.id("notes")),
    name: v.string(),
    query: v.string(),
    viewMode: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_folder", ["folderId"]),

  activityLog: defineTable({
    ownerId: v.string(),
    actorId: v.string(),
    actorName: v.optional(v.string()),
    noteId: v.optional(v.id("notes")),
    action: v.string(),
    summary: v.string(),
    meta: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_owner_time", ["ownerId", "createdAt"])
    .index("by_note", ["noteId", "createdAt"]),

  inboxRules: defineTable({
    ownerId: v.string(),
    enabled: v.boolean(),
    name: v.string(),
    matchType: v.union(
      v.literal("always"),
      v.literal("titleContains"),
      v.literal("hasTag"),
    ),
    matchValue: v.optional(v.string()),
    addTags: v.optional(v.array(v.string())),
    setStatus: v.optional(v.string()),
    moveToFolderId: v.optional(v.id("notes")),
    remindInHours: v.optional(v.number()),
    sortOrder: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),
});
