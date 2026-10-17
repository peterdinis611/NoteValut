import { describe, expect, it } from "vitest";
import {
  formatSearchFilters,
  hasActiveFacets,
  noteMatchesFilters,
  parseSearchFilters,
} from "@/lib/search-highlight";
import { applyBlockPatch, diffBlocks, mergeRemoteBlocks } from "@/lib/merge-blocks";
import type { Block } from "@/lib/blocks";

describe("parseSearchFilters", () => {
  it("parses status tag folder assignee", () => {
    const f = parseSearchFilters(
      "hello status:Todo tag:work folder:abc assignee:me after:2026-01-01",
    );
    expect(f.bareQuery).toBe("hello");
    expect(f.status).toBe("Todo");
    expect(f.tags).toEqual(["work"]);
    expect(f.folderId).toBe("abc");
    expect(f.assignee).toBe("me");
    expect(f.after).toBe("2026-01-01");
  });

  it("round-trips via formatSearchFilters", () => {
    const raw = "notes status:Doing tag:ops assignee:me";
    expect(formatSearchFilters(parseSearchFilters(raw))).toContain("status:Doing");
  });
});

describe("noteMatchesFilters", () => {
  const base = {
    tags: ["Work"],
    updatedAt: Date.parse("2026-03-15T12:00:00Z"),
    status: "Todo",
    parentId: "folder1",
    properties: { assignee: "user_1" },
  };

  it("matches status and folder", () => {
    expect(
      noteMatchesFilters(base, {
        bareQuery: "",
        tags: [],
        status: "Todo",
        folderId: "folder1",
      }),
    ).toBe(true);
    expect(
      noteMatchesFilters(base, {
        bareQuery: "",
        tags: [],
        status: "Done",
      }),
    ).toBe(false);
  });

  it("resolves assignee:me", () => {
    expect(
      noteMatchesFilters(
        base,
        { bareQuery: "", tags: [], assignee: "me" },
        { ownerId: "user_1" },
      ),
    ).toBe(true);
  });

  it("hasActiveFacets", () => {
    expect(hasActiveFacets({ bareQuery: "x", tags: [] })).toBe(false);
    expect(hasActiveFacets({ bareQuery: "", tags: [], status: "Todo" })).toBe(true);
  });
});

describe("merge-blocks", () => {
  const a = { id: "a", type: "paragraph", text: "A" } as Block;
  const b = { id: "b", type: "paragraph", text: "B" } as Block;
  const bLocal = { id: "b", type: "paragraph", text: "B-local" } as Block;
  const c = { id: "c", type: "paragraph", text: "C" } as Block;

  it("keeps dirty local blocks on remote merge", () => {
    const merged = mergeRemoteBlocks([a, bLocal], [a, b, c], new Set(["b"]));
    expect(merged.map((x) => x.text)).toEqual(["A", "B-local", "C"]);
  });

  it("applies upserts and deletes", () => {
    const next = applyBlockPatch([a, b], {
      upserts: [bLocal],
      deletes: ["a"],
      order: ["b", "c"],
    });
    // c not in byId so only b
    expect(next.map((x) => x.id)).toEqual(["b"]);
    expect(next[0]!.text).toBe("B-local");
  });

  it("diffs changed blocks", () => {
    const d = diffBlocks([a, b], [a, bLocal, c]);
    expect(d.upserts.map((x) => x.id).sort()).toEqual(["b", "c"]);
    expect(d.deletes).toEqual([]);
    expect(d.changed).toBe(true);
  });
});
