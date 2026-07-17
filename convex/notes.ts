import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { blockValidator } from "./block";

const block = blockValidator;

function isActive(item: { archived: boolean; trashed?: boolean }) {
  return !item.archived && !item.trashed;
}

function newId() {
  return crypto.randomUUID();
}

export const list = query({
  args: {
    ownerId: v.string(),
    search: v.optional(v.string()),
    includeArchived: v.optional(v.boolean()),
    includeTrashed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let notes = await ctx.db
      .query("notes")
      .withIndex("by_owner_updated", (q) => q.eq("ownerId", args.ownerId))
      .order("desc")
      .collect();

    if (!args.includeTrashed) {
      notes = notes.filter((n) => !n.trashed);
    }

    if (!args.includeArchived) {
      notes = notes.filter((n) => !n.archived);
    }

    if (args.search?.trim()) {
      const q = args.search.trim().toLowerCase();
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)) ||
          (n.description?.toLowerCase().includes(q) ?? false),
      );
    }

    return notes.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  },
});

export const get = query({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listChildren = query({
  args: { parentId: v.id("notes") },
  handler: async (ctx, args) => {
    const parent = await ctx.db.get(args.parentId);
    const children = await ctx.db
      .query("notes")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();

    const active = children.filter(isActive);
    const sortMode = parent?.sortMode ?? "updated";

    return active.sort((a, b) => {
      if (sortMode === "name") {
        return (a.title || "").localeCompare(b.title || "");
      }
      if (sortMode === "kind") {
        const ak = a.kind === "folder" ? 0 : 1;
        const bk = b.kind === "folder" ? 0 : 1;
        if (ak !== bk) return ak - bk;
      }
      return b.updatedAt - a.updatedAt;
    });
  },
});

export const listTrashed = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();

    return notes
      .filter((n) => n.trashed)
      .sort((a, b) => (b.trashedAt ?? 0) - (a.trashedAt ?? 0));
  },
});

export const getBreadcrumbs = query({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const crumbs: {
      id: Id<"notes">;
      title: string;
      icon: string;
      kind?: "page" | "folder";
    }[] = [];
    let current = await ctx.db.get(args.id);

    while (current) {
      crumbs.unshift({
        id: current._id,
        title: current.title,
        icon: current.icon,
        kind: current.kind,
      });
      if (!current.parentId) break;
      current = await ctx.db.get(current.parentId);
    }

    return crumbs;
  },
});

export const getVaultStats = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();

    const active = notes.filter(isActive);
    let openTasks = 0;

    for (const note of active) {
      if (note.kind === "folder") continue;
      for (const b of note.blocks ?? []) {
        if (b.type === "todo" && !b.checked) openTasks++;
      }
    }

    return {
      entries: active.filter((n) => n.kind !== "folder").length,
      collections: active.filter((n) => n.kind === "folder").length,
      favorites: active.filter((n) => n.pinned).length,
      openTasks,
      trashed: notes.filter((n) => n.trashed).length,
    };
  },
});

export const create = mutation({
  args: {
    ownerId: v.string(),
    title: v.optional(v.string()),
    parentId: v.optional(v.id("notes")),
    kind: v.optional(v.union(v.literal("page"), v.literal("folder"))),
    templateId: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    blocks: v.optional(v.array(block)),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const kind = args.kind ?? "page";
    const isFolder = kind === "folder";
    const blocks = isFolder ? undefined : (args.blocks ?? [{ id: newId(), type: "paragraph", text: "" }]);
    const content = blocks ? blocks.map((b) => b.text).join("\n") : "";

    return await ctx.db.insert("notes", {
      ownerId: args.ownerId,
      title: args.title ?? (isFolder ? "New collection" : "Untitled"),
      content,
      blocks,
      folderBlocks: isFolder
        ? [{ id: newId(), type: "paragraph", text: "" }]
        : undefined,
      icon: args.icon ?? (isFolder ? "🗂️" : "📝"),
      parentId: args.parentId,
      kind,
      color: args.color,
      description: args.description,
      viewMode: isFolder ? "grid" : undefined,
      sortMode: isFolder ? "updated" : undefined,
      defaultTemplateId: isFolder ? "blank" : undefined,
      isLocked: false,
      pinned: false,
      archived: false,
      trashed: false,
      tags: args.tags ?? [],
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("notes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    blocks: v.optional(v.array(block)),
    folderBlocks: v.optional(v.array(block)),
    icon: v.optional(v.string()),
    coverColor: v.optional(v.union(v.string(), v.null())),
    color: v.optional(v.union(v.string(), v.null())),
    description: v.optional(v.union(v.string(), v.null())),
    viewMode: v.optional(v.union(v.literal("grid"), v.literal("list"))),
    sortMode: v.optional(
      v.union(v.literal("updated"), v.literal("name"), v.literal("kind")),
    ),
    defaultTemplateId: v.optional(v.union(v.string(), v.null())),
    isLocked: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    pinned: v.optional(v.boolean()),
    archived: v.optional(v.boolean()),
    parentId: v.optional(v.union(v.id("notes"), v.null())),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Item not found");
    if (existing.isLocked && patch.isLocked !== false) {
      const allowed = ["isLocked", "pinned"];
      const keys = Object.keys(patch).filter((k) => patch[k as keyof typeof patch] !== undefined);
      if (keys.some((k) => !allowed.includes(k))) {
        throw new Error("Collection is locked (read-only)");
      }
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (patch.title !== undefined) updates.title = patch.title;
    if (patch.content !== undefined) updates.content = patch.content;
    if (patch.blocks !== undefined) updates.blocks = patch.blocks;
    if (patch.folderBlocks !== undefined) updates.folderBlocks = patch.folderBlocks;
    if (patch.icon !== undefined) updates.icon = patch.icon;
    if (patch.coverColor !== undefined) updates.coverColor = patch.coverColor ?? undefined;
    if (patch.color !== undefined) updates.color = patch.color ?? undefined;
    if (patch.description !== undefined) updates.description = patch.description ?? undefined;
    if (patch.viewMode !== undefined) updates.viewMode = patch.viewMode;
    if (patch.sortMode !== undefined) updates.sortMode = patch.sortMode;
    if (patch.defaultTemplateId !== undefined) {
      updates.defaultTemplateId = patch.defaultTemplateId ?? undefined;
    }
    if (patch.isLocked !== undefined) updates.isLocked = patch.isLocked;
    if (patch.tags !== undefined) updates.tags = patch.tags;
    if (patch.pinned !== undefined) updates.pinned = patch.pinned;
    if (patch.archived !== undefined) updates.archived = patch.archived;
    if (patch.parentId !== undefined) updates.parentId = patch.parentId ?? undefined;

    await ctx.db.patch(id, updates);
    return id;
  },
});

export const move = mutation({
  args: {
    id: v.id("notes"),
    parentId: v.union(v.id("notes"), v.null()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    if (args.parentId === args.id) throw new Error("Cannot move into itself");

    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent || parent.kind !== "folder") {
        throw new Error("Parent must be a collection");
      }
    }

    await ctx.db.patch(args.id, {
      parentId: args.parentId ?? undefined,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const trash = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.id, { trashed: true, trashedAt: now, updatedAt: now });
    return args.id;
  },
});

export const restoreFromTrash = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      trashed: false,
      trashedAt: undefined,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const emptyTrash = mutation({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    const trashed = await ctx.db
      .query("notes")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();

    const toDelete = trashed.filter((n) => n.trashed);
    for (const item of toDelete) {
      await permanentlyDelete(ctx, item._id);
    }
    return { deleted: toDelete.length };
  },
});

export const duplicate = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source || source.kind === "folder") throw new Error("Cannot duplicate");

    const now = Date.now();
    return await ctx.db.insert("notes", {
      ownerId: source.ownerId,
      title: `${source.title} (copy)`,
      content: source.content,
      blocks: source.blocks,
      icon: source.icon,
      coverColor: source.coverColor,
      parentId: source.parentId,
      kind: "page",
      color: source.color,
      pinned: false,
      archived: false,
      trashed: false,
      tags: source.tags,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    await permanentlyDelete(ctx, args.id);
  },
});

async function permanentlyDelete(ctx: MutationCtx, id: Id<"notes">) {
  const children = await ctx.db
    .query("notes")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .collect();

  for (const child of children) {
    await permanentlyDelete(ctx, child._id);
  }

  await ctx.db.delete(id);
}

export const seedDemo = mutation({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("notes")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();

    if (existing) return { seeded: false };

    const now = Date.now();

    const inboxId = await ctx.db.insert("notes", {
      ownerId: args.ownerId,
      title: "Inbox",
      content: "",
      icon: "📥",
      kind: "folder",
      color: "teal",
      description: "Quick captures land here",
      folderBlocks: [
        { id: newId(), type: "callout", text: "Drop quick ideas here via Quick Capture ⚡", calloutVariant: "tip" },
        { id: newId(), type: "paragraph", text: "This collection auto-receives captured entries." },
      ],
      viewMode: "list",
      sortMode: "updated",
      defaultTemplateId: "blank",
      isLocked: false,
      pinned: false,
      archived: false,
      trashed: false,
      tags: ["system"],
      updatedAt: now,
    });

    const workId = await ctx.db.insert("notes", {
      ownerId: args.ownerId,
      title: "Work",
      content: "",
      icon: "💼",
      kind: "folder",
      color: "violet",
      description: "Projects and meetings",
      folderBlocks: [
        { id: newId(), type: "heading2", text: "Work collection" },
        { id: newId(), type: "paragraph", text: "Organize project entries, meeting notes, and sprint boards." },
        { id: newId(), type: "todo", text: "Share this collection as read-only with your team", checked: false },
      ],
      viewMode: "grid",
      sortMode: "kind",
      defaultTemplateId: "meeting",
      isLocked: false,
      pinned: true,
      archived: false,
      trashed: false,
      tags: ["work"],
      updatedAt: now - 500,
    });

    await ctx.db.insert("notes", {
      ownerId: args.ownerId,
      title: "Welcome to your Vault",
      content: "NoteVault is your personal knowledge space",
      blocks: [
        { id: newId(), type: "heading1", text: "Welcome to NoteVault" },
        {
          id: newId(),
          type: "paragraph",
          text: "Organize ideas with Collections (folders), Entries (notes), and a powerful block editor — your own space, not a clone.",
        },
        { id: newId(), type: "callout", text: "Type / to insert blocks. Try callouts, tasks, and vault links!", calloutVariant: "tip" },
        { id: newId(), type: "heading2", text: "Quick tips" },
        { id: newId(), type: "bullet", text: "Use Collections to group related entries" },
        { id: newId(), type: "bullet", text: "Hit Quick Capture (bottom-right) for fast notes" },
        { id: newId(), type: "bullet", text: "Pick a template when creating new entries" },
        { id: newId(), type: "todo", text: "Explore the Work collection", checked: false },
      ],
      icon: "✨",
      coverColor: "from-teal-600/35 to-emerald-500/20",
      kind: "page",
      color: "teal",
      pinned: true,
      archived: false,
      trashed: false,
      tags: ["welcome"],
      updatedAt: now,
    });

    await ctx.db.insert("notes", {
      ownerId: args.ownerId,
      title: "Sprint planning",
      content: "",
      blocks: [
        { id: newId(), type: "heading2", text: "Sprint goal" },
        { id: newId(), type: "paragraph", text: "Ship the vault redesign with folders and templates." },
        { id: newId(), type: "heading2", text: "Tasks" },
        { id: newId(), type: "todo", text: "Review collections UI", checked: true },
        { id: newId(), type: "todo", text: "Test quick capture", checked: false },
      ],
      icon: "🎯",
      parentId: workId,
      kind: "page",
      color: "violet",
      pinned: false,
      archived: false,
      trashed: false,
      tags: ["sprint"],
      updatedAt: now - 1500,
    });

    await ctx.db.insert("notes", {
      ownerId: args.ownerId,
      title: "Quick idea",
      content: "Add keyboard shortcuts overlay",
      blocks: [
        { id: newId(), type: "paragraph", text: "Add keyboard shortcuts overlay" },
      ],
      icon: "💡",
      parentId: inboxId,
      kind: "page",
      pinned: false,
      archived: false,
      trashed: false,
      tags: ["idea"],
      updatedAt: now - 3000,
    });

    return { seeded: true };
  },
});
