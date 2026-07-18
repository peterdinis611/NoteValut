import { v } from "convex/values";

/** Shared Convex validator for editor blocks — keep schema + mutations in sync. */
export const blockValidator = v.object({
  id: v.string(),
  type: v.union(
    v.literal("paragraph"),
    v.literal("heading1"),
    v.literal("heading2"),
    v.literal("heading3"),
    v.literal("heading4"),
    v.literal("heading5"),
    v.literal("heading6"),
    v.literal("bullet"),
    v.literal("numbered"),
    v.literal("todo"),
    v.literal("quote"),
    v.literal("code"),
    v.literal("divider"),
    v.literal("callout"),
    v.literal("pagelink"),
    v.literal("toggle"),
    v.literal("image"),
    v.literal("custom"),
    v.literal("table"),
    v.literal("video"),
    v.literal("link"),
    v.literal("pdf"),
  ),
  text: v.string(),
  checked: v.optional(v.boolean()),
  calloutVariant: v.optional(
    v.union(v.literal("info"), v.literal("tip"), v.literal("warning")),
  ),
  pageId: v.optional(v.string()),
  language: v.optional(v.string()),
  url: v.optional(v.string()),
  label: v.optional(v.string()),
  rows: v.optional(v.array(v.array(v.string()))),
  color: v.optional(v.string()),
  bgColor: v.optional(v.string()),
  width: v.optional(v.number()),
  align: v.optional(
    v.union(v.literal("left"), v.literal("center"), v.literal("right")),
  ),
  /** Nesting level for lists / todos (0–5) */
  indent: v.optional(v.number()),
  /** Todo due date (ms epoch) */
  dueAt: v.optional(v.number()),
  /** Bookmarked / pinned within the page */
  pinned: v.optional(v.boolean()),
  /** Shared id for blocks rendered as columns */
  layoutGroupId: v.optional(v.string()),
  /** Column index within layout group (0-based) */
  columnIndex: v.optional(v.number()),
  /** Total columns in the layout group (on each column block) */
  columnCount: v.optional(v.number()),
});
