import { describe, expect, it } from "vitest";
import {
  applyViewConfig,
  evalFormula,
  evalRollup,
  formatPropValue,
  groupByProperty,
  itemsOnDate,
  parseQueryString,
  type PropertyDef,
} from "@/lib/properties";

describe("parseQueryString", () => {
  it("parses status, tags, props, and free text", () => {
    const q = parseQueryString("status:Todo tag:work #inbox prop:priority=High due review");
    expect(q.status).toBe("Todo");
    expect(q.tags).toEqual(["work", "inbox"]);
    expect(q.props).toEqual([{ id: "priority", value: "High" }]);
    expect(q.text).toBe("due review");
  });

  it("handles empty input", () => {
    const q = parseQueryString("   ");
    expect(q.status).toBeUndefined();
    expect(q.tags).toEqual([]);
    expect(q.props).toEqual([]);
    expect(q.text).toBe("");
  });
});

describe("formatPropValue", () => {
  const select: PropertyDef = { id: "priority", name: "Priority", type: "select" };
  const checkbox: PropertyDef = { id: "done", name: "Done", type: "checkbox" };
  const multi: PropertyDef = { id: "tags", name: "Tags", type: "multiSelect" };

  it("formats empty as dash", () => {
    expect(formatPropValue(select, null)).toBe("—");
    expect(formatPropValue(select, "")).toBe("—");
  });

  it("formats checkbox and multiSelect", () => {
    expect(formatPropValue(checkbox, true)).toBe("Yes");
    expect(formatPropValue(checkbox, false)).toBe("No");
    expect(formatPropValue(multi, ["a", "b"])).toBe("a, b");
  });
});

describe("applyViewConfig", () => {
  const items = [
    { title: "A", status: "Todo", tags: ["work"], pinned: false, updatedAt: 10, properties: { priority: "High" } },
    { title: "B", status: "Done", tags: ["home"], pinned: true, updatedAt: 30, properties: { priority: "Low" } },
    { title: "C", status: "Todo", tags: ["work"], pinned: false, updatedAt: 20, properties: { priority: "High" } },
  ];

  it("filters by builtin status", () => {
    const out = applyViewConfig(items, {
      filters: [{ builtin: "status", op: "eq", value: "Todo" }],
    });
    expect(out.map((i) => i.title)).toEqual(["A", "C"]);
  });

  it("filters by property and sorts by updated desc", () => {
    const out = applyViewConfig(items, {
      filters: [{ propertyId: "priority", op: "eq", value: "High" }],
      sorts: [{ builtin: "updated", dir: "desc" }],
    });
    expect(out.map((i) => i.title)).toEqual(["C", "A"]);
  });

  it("filters tags with contains", () => {
    const out = applyViewConfig(items, {
      filters: [{ builtin: "tags", op: "contains", value: "home" }],
    });
    expect(out).toHaveLength(1);
    expect(out[0]!.title).toBe("B");
  });
});

describe("groupByProperty", () => {
  it("groups by status", () => {
    const map = groupByProperty(
      [
        { status: "Todo" },
        { status: "Done" },
        { status: "Todo" },
        { status: undefined },
      ],
      "status",
    );
    expect(map.get("Todo")).toHaveLength(2);
    expect(map.get("Done")).toHaveLength(1);
    expect(map.get("")).toHaveLength(1);
  });

  it("groups by custom property", () => {
    const map = groupByProperty(
      [
        { properties: { priority: "High" } },
        { properties: { priority: "Low" } },
        { properties: { priority: "High" } },
      ],
      "priority",
    );
    expect(map.get("High")).toHaveLength(2);
    expect(map.get("Low")).toHaveLength(1);
  });
});

describe("evalFormula", () => {
  it("evaluates prop() math", () => {
    const r = evalFormula("prop('score') * 2", {
      properties: { score: 21 },
      defs: [{ id: "score", name: "Score", type: "number" }],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.display).toBe("42");
  });
});

describe("evalRollup", () => {
  it("counts related items", () => {
    const def: PropertyDef = {
      id: "roll",
      name: "Count",
      type: "rollup",
      rollupAgg: "count",
    };
    expect(evalRollup(def, [{}, {}, {}])).toBe("3");
  });
});

describe("itemsOnDate", () => {
  it("filters by local calendar day", () => {
    const day = new Date(2026, 0, 15).getTime();
    const items = [
      { properties: { due: new Date(2026, 0, 15, 10).getTime() } },
      { properties: { due: new Date(2026, 0, 16, 10).getTime() } },
    ];
    expect(itemsOnDate(items, "due", day)).toHaveLength(1);
  });
});
