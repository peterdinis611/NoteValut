import { beforeEach, describe, expect, it } from "vitest";
import {
  loadCustomTemplates,
  removeCustomTemplate,
} from "@/db/templates-collection";
import { createBlock } from "@/lib/blocks";
import { createCustomTemplate } from "@/lib/create-custom-template";
import { parseTemplateName } from "@/lib/validation";

function clearTemplates() {
  for (const t of loadCustomTemplates()) {
    removeCustomTemplate(t.id);
  }
}

describe("parseTemplateName", () => {
  it("accepts a trimmed name", () => {
    const result = parseTemplateName("  Sprint retro  ");
    expect(result.success).toBe(true);
    if (result.success) expect(result.output).toBe("Sprint retro");
  });

  it("rejects an empty name", () => {
    const result = parseTemplateName("   ");
    expect(result.success).toBe(false);
  });

  it("rejects names longer than 60 chars", () => {
    const result = parseTemplateName("x".repeat(61));
    expect(result.success).toBe(false);
  });
});

describe("createCustomTemplate", () => {
  beforeEach(() => {
    localStorage.clear();
    clearTemplates();
  });

  it("creates a template from form fields", () => {
    const result = createCustomTemplate({
      name: "Sprint retro",
      icon: "🔄",
      description: "End of sprint notes",
      tagsDraft: "work, planning",
      blocks: [createBlock("heading2", "Wins"), createBlock("bullet", "")],
    });

    expect(result).toMatchObject({ success: true, name: "Sprint retro" });
    if (!result.success) return;

    const stored = loadCustomTemplates();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      id: result.id,
      name: "Sprint retro",
      icon: "🔄",
      description: "End of sprint notes",
      tags: ["work", "planning"],
      custom: true,
    });
    expect(stored[0].blocks).toHaveLength(2);
    expect(stored[0].blocks[0].text).toBe("Wins");
  });

  it("defaults empty name, icon, and description", () => {
    const result = createCustomTemplate({
      name: "   ",
      blocks: [createBlock("paragraph", "Hello")],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const stored = loadCustomTemplates()[0];
    expect(stored.name).toBe("Untitled template");
    expect(stored.icon).toBe("✦");
    expect(stored.description).toBe("Custom template");
    expect(stored.tags).toEqual([]);
  });

  it("uses default blocks when the list is empty", () => {
    const result = createCustomTemplate({
      name: "Blank start",
      blocks: [],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(loadCustomTemplates()[0].blocks.length).toBeGreaterThan(0);
  });

  it("ignores invalid tags in the draft and still saves", () => {
    const result = createCustomTemplate({
      name: "Tagged",
      tagsDraft: "ok, !!!bad!!!",
      blocks: [createBlock("paragraph", "")],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    // invalid token fails normalizeTags → empty tags fallback
    expect(loadCustomTemplates()[0].tags).toEqual([]);
  });

  it("accepts an explicit tags array", () => {
    const result = createCustomTemplate({
      name: "From page",
      tags: ["vault", "saved"],
      blocks: [createBlock("paragraph", "Body")],
    });

    expect(result.success).toBe(true);
    expect(loadCustomTemplates()[0].tags).toEqual(["vault", "saved"]);
  });

  it("clones block ids so the template is independent of the source", () => {
    const source = createBlock("paragraph", "Shared");
    const result = createCustomTemplate({
      name: "Clone",
      blocks: [source],
    });

    expect(result.success).toBe(true);
    const stored = loadCustomTemplates()[0];
    expect(stored.blocks[0].id).not.toBe(source.id);
    expect(stored.blocks[0].text).toBe("Shared");
  });
});
