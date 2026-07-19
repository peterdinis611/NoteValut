import { describe, expect, it } from "vitest";
import { createBlock, defaultBlocks, emptyTable } from "@/lib/blocks";
import { formatRelativeTime, notePreview } from "@/lib/format";
import { getKind, isFolder, isTrashed, itemLabel } from "@/lib/item-kinds";
import { permissionLabel, shareUrl } from "@/lib/share";

describe("createBlock", () => {
  it("assigns an id and type-specific defaults", () => {
    const todo = createBlock("todo", "Ship it");
    expect(todo.id).toBeTruthy();
    expect(todo.type).toBe("todo");
    expect(todo.checked).toBe(false);

    const callout = createBlock("callout", "Note");
    expect(callout.calloutVariant).toBe("info");

    const code = createBlock("code", "const x = 1");
    expect(code.language).toBe("auto");

    const table = createBlock("table");
    expect(table.rows).toEqual(emptyTable());
  });

  it("provides a non-empty defaultBlocks list", () => {
    expect(defaultBlocks().length).toBeGreaterThan(0);
  });
});

describe("item-kinds", () => {
  it("defaults kind to page", () => {
    expect(getKind({})).toBe("page");
    expect(isFolder({ kind: "folder" })).toBe(true);
    expect(isFolder({ kind: "page" })).toBe(false);
    expect(isTrashed({ trashed: true })).toBe(true);
    expect(itemLabel("folder")).toBe("Collection");
    expect(itemLabel("page", true)).toBe("Entries");
  });
});

describe("format", () => {
  it("formats relative times", () => {
    expect(formatRelativeTime(Date.now())).toBe("Just now");
    expect(formatRelativeTime(Date.now() - 5 * 60_000)).toBe("5m ago");
    expect(formatRelativeTime(Date.now() - 3 * 60 * 60_000)).toBe("3h ago");
    expect(formatRelativeTime(Date.now() - 2 * 24 * 60 * 60_000)).toBe("2d ago");
  });

  it("builds previews from blocks before raw content", () => {
    expect(
      notePreview("fallback", [
        { type: "divider", text: "" },
        { type: "paragraph", text: "Hello world" },
      ]),
    ).toBe("Hello world");

    expect(notePreview("only content line")).toBe("only content line");
    expect(notePreview("x".repeat(100)).endsWith("…")).toBe(true);
  });
});

describe("share helpers", () => {
  it("builds share urls and permission labels", () => {
    expect(shareUrl("abc")).toMatch(/\/share\/abc$/);
    expect(permissionLabel("read")).toBe("Viewer");
    expect(permissionLabel("write")).toBe("Editor");
  });
});
