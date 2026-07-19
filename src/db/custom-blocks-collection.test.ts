import { beforeEach, describe, expect, it } from "vitest";
import {
  loadCustomBlockTemplates,
  removeCustomBlockTemplate,
  saveCustomBlockTemplate,
} from "@/db/custom-blocks-collection";

function clearBlocks() {
  for (const b of loadCustomBlockTemplates()) {
    removeCustomBlockTemplate(b.id);
  }
}

describe("custom-blocks-collection", () => {
  beforeEach(() => {
    localStorage.clear();
    clearBlocks();
  });

  it("saves and loads custom block templates", () => {
    saveCustomBlockTemplate({
      id: "cb-1",
      label: "API snippet",
      description: "Fetch wrapper",
      icon: "⚙️",
      body: "fetch('/api')",
    });

    const all = loadCustomBlockTemplates();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      id: "cb-1",
      label: "API snippet",
      body: "fetch('/api')",
    });
    expect(all[0].updatedAt).toBeTypeOf("number");
  });

  it("replaces duplicates by label case-insensitively", () => {
    saveCustomBlockTemplate({ id: "a", label: "Snippet" });
    saveCustomBlockTemplate({ id: "b", label: "snippet", body: "new" });

    const all = loadCustomBlockTemplates();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe("b");
    expect(all[0].body).toBe("new");
  });

  it("removes by id", () => {
    saveCustomBlockTemplate({ id: "gone", label: "Temp" });
    removeCustomBlockTemplate("gone");
    expect(loadCustomBlockTemplates()).toHaveLength(0);
  });

  it("keeps at most 24 templates", () => {
    for (let i = 0; i < 27; i++) {
      saveCustomBlockTemplate({
        id: `cb-${i}`,
        label: `Block ${i}`,
      });
    }
    expect(loadCustomBlockTemplates()).toHaveLength(24);
  });
});
