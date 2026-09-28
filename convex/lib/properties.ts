import { v } from "convex/values";

export const propertyTypeValidator = v.union(
  v.literal("text"),
  v.literal("number"),
  v.literal("select"),
  v.literal("multiSelect"),
  v.literal("date"),
  v.literal("checkbox"),
  v.literal("url"),
  v.literal("relation"),
  v.literal("formula"),
);

export const propertyDefValidator = v.object({
  id: v.string(),
  name: v.string(),
  type: propertyTypeValidator,
  options: v.optional(v.array(v.string())),
  formula: v.optional(v.string()),
  relationFolderId: v.optional(v.string()),
});

export const propertyValueValidator = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.array(v.string()),
  v.null(),
);

export const viewFilterValidator = v.object({
  propertyId: v.optional(v.string()),
  builtin: v.optional(
    v.union(v.literal("status"), v.literal("tags"), v.literal("pinned")),
  ),
  op: v.union(
    v.literal("eq"),
    v.literal("neq"),
    v.literal("contains"),
    v.literal("gt"),
    v.literal("lt"),
    v.literal("empty"),
    v.literal("notEmpty"),
  ),
  value: v.optional(v.union(v.string(), v.number(), v.boolean())),
});

export const viewSortValidator = v.object({
  propertyId: v.optional(v.string()),
  builtin: v.optional(
    v.union(
      v.literal("title"),
      v.literal("updated"),
      v.literal("status"),
      v.literal("pinned"),
    ),
  ),
  dir: v.union(v.literal("asc"), v.literal("desc")),
});

export const viewConfigValidator = v.object({
  filters: v.optional(v.array(viewFilterValidator)),
  sorts: v.optional(v.array(viewSortValidator)),
  groupBy: v.optional(v.string()),
});
