import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { buildNoteSearchText } from "./lib/searchText";
import { embedText } from "./lib/embed";

export const MAX_VERSIONS = 20;

export async function snapshotNote(
  ctx: MutationCtx,
  noteId: Id<"notes">,
  label?: string,
) {
  const note = await ctx.db.get(noteId);
  if (!note || note.kind === "folder") return;

  await ctx.db.insert("noteVersions", {
    noteId: note._id,
    ownerId: note.ownerId,
    title: note.title,
    content: note.content,
    blocks: note.blocks,
    tags: note.tags,
    createdAt: Date.now(),
    label: label?.trim() || undefined,
  });

  await pruneVersions(ctx, noteId);
}

async function pruneVersions(ctx: MutationCtx, noteId: Id<"notes">) {
  const all = await ctx.db
    .query("noteVersions")
    .withIndex("by_note", (q) => q.eq("noteId", noteId))
    .order("desc")
    .collect();

  for (const extra of all.slice(MAX_VERSIONS)) {
    await ctx.db.delete(extra._id);
  }
}

export const listForNote = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const versions = await ctx.db
      .query("noteVersions")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .order("desc")
      .take(MAX_VERSIONS);

    return versions.map((ver) => ({
      _id: ver._id,
      title: ver.title,
      createdAt: ver.createdAt,
      preview: ver.content.slice(0, 120),
      blockCount: ver.blocks?.length ?? 0,
      label: ver.label,
    }));
  },
});

export const get = query({
  args: { id: v.id("noteVersions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const nameSnapshot = mutation({
  args: {
    versionId: v.id("noteVersions"),
    label: v.string(),
  },
  handler: async (ctx, args) => {
    const ver = await ctx.db.get(args.versionId);
    if (!ver) throw new Error("Not found");
    await ctx.db.patch(args.versionId, { label: args.label.trim().slice(0, 80) || undefined });
  },
});

export const createNamed = mutation({
  args: {
    noteId: v.id("notes"),
    label: v.string(),
  },
  handler: async (ctx, args) => {
    await snapshotNote(ctx, args.noteId, args.label);
    return args.noteId;
  },
});

export const restore = mutation({
  args: {
    noteId: v.id("notes"),
    versionId: v.id("noteVersions"),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    const version = await ctx.db.get(args.versionId);
    if (!note || !version) throw new Error("Not found");
    if (version.noteId !== args.noteId) throw new Error("Version mismatch");
    if (note.kind === "folder") throw new Error("Cannot restore folder history");

    await snapshotNote(ctx, args.noteId, "Before restore");

    const searchText = buildNoteSearchText({
      title: version.title,
      content: version.content,
      tags: version.tags,
      blocks: version.blocks,
    });

    await ctx.db.patch(args.noteId, {
      title: version.title,
      content: version.content,
      blocks: version.blocks,
      tags: version.tags,
      searchText,
      embedding: embedText(searchText),
      updatedAt: Date.now(),
    });

    return args.noteId;
  },
});
