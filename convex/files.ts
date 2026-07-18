import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Browser POSTs the file to this URL, then calls getUrl with the returned storageId. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/** Resolve a storage id to a durable URL right after upload (mutation so it is awaitable). */
export const resolveUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("File not found");
    return url;
  },
});
