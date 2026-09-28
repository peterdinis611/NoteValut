import { describe, expect, it } from "vitest";
import { searchNotes } from "@/lib/search";
import type { Doc } from "../../convex/_generated/dataModel";

function note(partial: Partial<Doc<"notes">> & { _id: string; title: string }): Doc<"notes"> {
  return {
    _creationTime: 0,
    ownerId: "user_1",
    content: "",
    icon: "📄",
    pinned: false,
    archived: false,
    tags: [],
    updatedAt: Date.now(),
    ...partial,
  } as Doc<"notes">;
}

describe("searchNotes (fuse)", () => {
  const notes = [
    note({ _id: "1", title: "Weekly review", tags: ["planning"], content: "wins and lessons" }),
    note({ _id: "2", title: "Meeting notes", tags: ["meeting"], content: "agenda items" }),
    note({ _id: "3", title: "Bug report", tags: ["engineering"], content: "repro steps" }),
  ];

  it("returns all notes for empty query", () => {
    expect(searchNotes(notes, "")).toHaveLength(3);
    expect(searchNotes(notes, "  ")).toHaveLength(3);
  });

  it("fuzzy-matches titles", () => {
    const hits = searchNotes(notes, "week rev");
    expect(hits[0]!.title).toBe("Weekly review");
  });

  it("matches tag and body content", () => {
    const byTag = searchNotes(notes, "engineering");
    expect(byTag.some((n) => n.title === "Bug report")).toBe(true);

    const byBody = searchNotes(notes, "agenda");
    expect(byBody.some((n) => n.title === "Meeting notes")).toBe(true);
  });
});
