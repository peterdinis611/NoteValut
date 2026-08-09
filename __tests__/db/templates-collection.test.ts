import { beforeEach, describe, expect, it } from "vitest";
import {
  getCustomTemplate,
  loadCustomTemplates,
  removeCustomTemplate,
  saveCustomTemplate,
} from "@/db/templates-collection";
import { createBlock } from "@/lib/blocks";

function clearTemplates() {
  for (const t of loadCustomTemplates()) {
    removeCustomTemplate(t.id);
  }
}

function sampleTemplate(
  overrides: Partial<{
    id: string;
    name: string;
    icon: string;
    description: string;
    tags: string[];
    createdAt: number;
  }> = {},
) {
  return {
    id: overrides.id ?? `custom-${crypto.randomUUID()}`,
    name: overrides.name ?? "Sprint retro",
    icon: overrides.icon ?? "📋",
    description: overrides.description ?? "Weekly retro notes",
    tags: overrides.tags ?? ["work"],
    blocks: [createBlock("heading2", "What went well"), createBlock("paragraph", "")],
    createdAt: overrides.createdAt,
  };
}

describe("templates-collection", () => {
  beforeEach(() => {
    localStorage.clear();
    clearTemplates();
  });

  it("saves and loads a custom template", () => {
    const saved = sampleTemplate({ name: "Meeting notes" });
    saveCustomTemplate(saved);

    const all = loadCustomTemplates();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      id: saved.id,
      name: "Meeting notes",
      icon: "📋",
      description: "Weekly retro notes",
      tags: ["work"],
      custom: true,
    });
    expect(all[0].blocks).toHaveLength(2);
    expect(getCustomTemplate(saved.id)?.name).toBe("Meeting notes");
  });

  it("updates an existing template by id", () => {
    const id = "custom-fixed";
    saveCustomTemplate(sampleTemplate({ id, name: "Draft" }));
    saveCustomTemplate(
      sampleTemplate({ id, name: "Final", description: "Updated", tags: ["done"] }),
    );

    const all = loadCustomTemplates();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      id,
      name: "Final",
      description: "Updated",
      tags: ["done"],
    });
  });

  it("replaces another template with the same name (case-insensitive)", () => {
    saveCustomTemplate(sampleTemplate({ id: "a", name: "Retro" }));
    saveCustomTemplate(sampleTemplate({ id: "b", name: "retro" }));

    const all = loadCustomTemplates();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe("b");
    expect(all[0].name).toBe("retro");
  });

  it("removes a template by id", () => {
    const saved = sampleTemplate();
    saveCustomTemplate(saved);
    removeCustomTemplate(saved.id);

    expect(loadCustomTemplates()).toHaveLength(0);
    expect(getCustomTemplate(saved.id)).toBeUndefined();
  });

  it("sorts by createdAt descending", () => {
    saveCustomTemplate(sampleTemplate({ id: "old", name: "Old", createdAt: 100 }));
    saveCustomTemplate(sampleTemplate({ id: "new", name: "New", createdAt: 200 }));

    expect(loadCustomTemplates().map((t) => t.id)).toEqual(["new", "old"]);
  });

  it("keeps at most 32 templates", () => {
    for (let i = 0; i < 35; i++) {
      saveCustomTemplate(
        sampleTemplate({
          id: `custom-${i}`,
          name: `Template ${i}`,
          createdAt: i,
        }),
      );
    }

    const all = loadCustomTemplates();
    expect(all).toHaveLength(32);
    expect(all.map((t) => t.id)).not.toContain("custom-0");
    expect(all.map((t) => t.id)).not.toContain("custom-1");
    expect(all.map((t) => t.id)).not.toContain("custom-2");
    expect(all[0].id).toBe("custom-34");
  });
});
