import { v } from "convex/values";
import { query } from "./_generated/server";

/** Public catalog of published pages (blog index). */
export const listPublished = query({
  args: {
    tag: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("publications").collect();
    const published = all.filter((p) => p.published);
    const limit = Math.min(args.limit ?? 50, 100);
    const tag = args.tag?.trim().toLowerCase();

    const rows = [];
    for (const pub of published.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))) {
      const note = await ctx.db.get(pub.noteId);
      if (!note || note.trashed || note.archived || note.kind === "folder") continue;
      if (tag && !(note.tags ?? []).some((t) => t.toLowerCase() === tag)) continue;
      rows.push({
        slug: pub.slug,
        title: pub.title || note.title,
        description: pub.description,
        ogImage: pub.ogImage || note.coverImage,
        publishedAt: pub.publishedAt,
        updatedAt: Math.max(pub.updatedAt, note.updatedAt),
        icon: note.icon,
        tags: note.tags ?? [],
      });
      if (rows.length >= limit) break;
    }
    return rows;
  },
});

export const listTags = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("publications").collect();
    const counts = new Map<string, number>();
    for (const pub of all.filter((p) => p.published)) {
      const note = await ctx.db.get(pub.noteId);
      if (!note || note.trashed || note.archived) continue;
      for (const tag of note.tags ?? []) {
        const key = tag.trim();
        if (!key) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  },
});
