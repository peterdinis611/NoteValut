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
    kind: v.optional(v.union(v.literal("page"), v.literal("folder"))),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
    viewMode: v.optional(v.union(v.literal("grid"), v.literal("list"))),
    sortMode: v.optional(
      v.union(v.literal("updated"), v.literal("name"), v.literal("kind")),
    ),
    defaultTemplateId: v.optional(v.string()),
    isLocked: v.optional(v.boolean()),
    pinned: v.boolean(),
    archived: v.boolean(),
    trashed: v.optional(v.boolean()),
    trashedAt: v.optional(v.number()),
    tags: v.array(v.string()),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_updated", ["ownerId", "updatedAt"])
    .index("by_parent", ["parentId"]),

  vaultSettings: defineTable({
    ownerId: v.string(),
    sharingEnabled: v.boolean(),
    publicReadonly: v.boolean(),
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
  })
    .index("by_token", ["token"])
    .index("by_owner", ["ownerId"]),
});
