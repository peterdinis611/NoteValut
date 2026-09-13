import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwner } from "./lib/auth";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function ensureSlug(raw: string, fallback: string): string {
  const s = slugify(raw) || slugify(fallback) || "page";
  return s;
}

export const list = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    return await ctx.db
      .query("publications")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
  },
});

export const getForNote = query({
  args: { ownerId: v.string(), noteId: v.id("notes") },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    return await ctx.db
      .query("publications")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .first();
  },
});

/** Public — no auth. Used by /p/[slug] + metadata. */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const pub = await ctx.db
      .query("publications")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!pub || !pub.published) return null;

    const note = await ctx.db.get(pub.noteId);
    if (!note || note.trashed || note.archived || note.kind === "folder") return null;

    return {
      slug: pub.slug,
      title: pub.title || note.title,
      description: pub.description,
      ogImage: pub.ogImage || note.coverImage,
      publishedAt: pub.publishedAt,
      updatedAt: Math.max(pub.updatedAt, note.updatedAt),
      icon: note.icon,
      coverColor: note.coverColor,
      coverImage: note.coverImage,
      blocks: note.blocks ?? [],
      tags: note.tags,
    };
  },
});

export const publish = mutation({
  args: {
    ownerId: v.string(),
    noteId: v.id("notes"),
    slug: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    ogImage: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const note = await ctx.db.get(args.noteId);
    if (!note || note.ownerId !== args.ownerId) throw new Error("Not found");
    if (note.kind === "folder") throw new Error("Cannot publish a collection");

    const slug = ensureSlug(args.slug, note.title || "page");
    const existing = await ctx.db
      .query("publications")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing && existing.noteId !== args.noteId) {
      throw new Error("Slug already taken");
    }

    const now = Date.now();
    const forNote = await ctx.db
      .query("publications")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .first();

    const payload = {
      ownerId: args.ownerId,
      noteId: args.noteId,
      slug,
      title: (args.title ?? note.title).trim() || note.title || "Untitled",
      description: (args.description ?? "").trim().slice(0, 300),
      ogImage: args.ogImage === null ? undefined : (args.ogImage ?? note.coverImage),
      published: true,
      publishedAt: forNote?.publishedAt ?? now,
      updatedAt: now,
    };

    if (forNote) {
      await ctx.db.patch(forNote._id, payload);
      return forNote._id;
    }
    return await ctx.db.insert("publications", payload);
  },
});

export const unpublish = mutation({
  args: { ownerId: v.string(), noteId: v.id("notes") },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const forNote = await ctx.db
      .query("publications")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .first();
    if (!forNote || forNote.ownerId !== args.ownerId) return;
    await ctx.db.patch(forNote._id, { published: false, updatedAt: Date.now() });
  },
});

export const update = mutation({
  args: {
    ownerId: v.string(),
    noteId: v.id("notes"),
    slug: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    ogImage: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.ownerId);
    const forNote = await ctx.db
      .query("publications")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .first();
    if (!forNote || forNote.ownerId !== args.ownerId) throw new Error("Not published");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.slug !== undefined) {
      const slug = ensureSlug(args.slug, forNote.title);
      const clash = await ctx.db
        .query("publications")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      if (clash && clash._id !== forNote._id) throw new Error("Slug already taken");
      patch.slug = slug;
    }
    if (args.title !== undefined) patch.title = args.title.trim() || forNote.title;
    if (args.description !== undefined) patch.description = args.description.trim().slice(0, 300);
    if (args.ogImage !== undefined) patch.ogImage = args.ogImage === null ? undefined : args.ogImage;

    await ctx.db.patch(forNote._id, patch);
  },
});
