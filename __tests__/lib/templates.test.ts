import { beforeEach, describe, expect, it } from "vitest";
import {
  loadCustomTemplates,
  removeCustomTemplate,
  saveCustomTemplate,
} from "@/db/templates-collection";
import { createBlock } from "@/lib/blocks";
import {
  getTemplate,
  listAllTemplates,
  listDefaultTemplates,
  PAGE_TEMPLATES,
} from "@/lib/templates";

function clearTemplates() {
  for (const t of loadCustomTemplates()) {
    removeCustomTemplate(t.id);
  }
}

describe("PAGE_TEMPLATES", () => {
  it("includes blank and several built-ins with unique ids", () => {
    const ids = PAGE_TEMPLATES.map((t) => t.id);
    expect(ids).toContain("blank");
    expect(ids).toContain("meeting");
    expect(ids).toContain("standup");
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every template at least one block", () => {
    for (const template of PAGE_TEMPLATES) {
      expect(template.blocks.length).toBeGreaterThan(0);
      expect(template.name.trim()).not.toBe("");
      expect(template.icon.trim()).not.toBe("");
    }
  });
});

describe("listDefaultTemplates", () => {
  it("excludes blank", () => {
    const defaults = listDefaultTemplates();
    expect(defaults.every((t) => t.id !== "blank")).toBe(true);
    expect(defaults.length).toBe(PAGE_TEMPLATES.length - 1);
  });
});

describe("getTemplate / listAllTemplates", () => {
  beforeEach(() => {
    localStorage.clear();
    clearTemplates();
  });

  it("returns a built-in by id", () => {
    const meeting = getTemplate("meeting");
    expect(meeting.name).toBe("Meeting notes");
    expect(meeting.blocks.some((b) => b.text === "Agenda")).toBe(true);
  });

  it("returns a custom template by id", () => {
    saveCustomTemplate({
      id: "custom-abc",
      name: "My retro",
      icon: "🔁",
      description: "Custom",
      tags: ["team"],
      blocks: [createBlock("heading2", "Wins")],
    });

    const custom = getTemplate("custom-abc");
    expect(custom.name).toBe("My retro");
    expect(custom.blocks[0].text).toBe("Wins");
  });

  it("falls back to blank for unknown ids", () => {
    expect(getTemplate("does-not-exist").id).toBe("blank");
  });

  it("lists customs before built-ins", () => {
    saveCustomTemplate({
      id: "custom-1",
      name: "Zeta",
      icon: "Z",
      description: "",
      tags: [],
      blocks: [createBlock("paragraph", "")],
      createdAt: 1,
    });

    const all = listAllTemplates();
    expect(all[0].id).toBe("custom-1");
    expect(all.some((t) => t.id === "blank")).toBe(true);
    expect(all.length).toBe(PAGE_TEMPLATES.length + 1);
  });
});
