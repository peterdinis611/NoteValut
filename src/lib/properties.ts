/** Database 2.0 — typed property definitions & values. */

import { evaluateMath } from "@/lib/math-engine";

export const PROPERTY_TYPES = [
  "text",
  "number",
  "select",
  "multiSelect",
  "date",
  "checkbox",
  "url",
  "relation",
  "formula",
  "rollup",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export type PropertyDef = {
  id: string;
  name: string;
  type: PropertyType;
  /** select / multiSelect options */
  options?: string[];
  /** formula expression, e.g. "prop('Estimate') * 2" */
  formula?: string;
  /** relation target collection id (optional) */
  relationFolderId?: string;
  /** rollup: which relation property to walk */
  rollupRelationId?: string;
  /** rollup: property on related pages */
  rollupPropertyId?: string;
  /** rollup aggregation */
  rollupAgg?: "count" | "sum" | "avg" | "min" | "max";
};

export type PropertyValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;

export type PropertyMap = Record<string, PropertyValue>;

export type ViewFilter = {
  propertyId?: string;
  builtin?: "status" | "tags" | "pinned";
  op: "eq" | "neq" | "contains" | "gt" | "lt" | "empty" | "notEmpty";
  value?: string | number | boolean;
};

export type ViewSort = {
  propertyId?: string;
  builtin?: "title" | "updated" | "status" | "pinned";
  dir: "asc" | "desc";
};

export type ViewConfig = {
  filters?: ViewFilter[];
  sorts?: ViewSort[];
  groupBy?: string;
};

export function newPropertyId() {
  return crypto.randomUUID().slice(0, 8);
}

export function defaultPropertyDefs(): PropertyDef[] {
  return [
    {
      id: "status",
      name: "Status",
      type: "select",
      options: ["Todo", "Doing", "Done", "Blocked"],
    },
    {
      id: "priority",
      name: "Priority",
      type: "select",
      options: ["Low", "Medium", "High"],
    },
    {
      id: "due",
      name: "Due",
      type: "date",
    },
  ];
}

export function getPropValue(
  properties: PropertyMap | undefined,
  def: PropertyDef,
  builtins?: { status?: string; tags?: string[] },
): PropertyValue {
  if (def.id === "status" && builtins?.status !== undefined) return builtins.status || "";
  if (def.id === "tags" && builtins?.tags) return builtins.tags;
  return properties?.[def.id];
}

/**
 * Evaluate a formula against page properties.
 * Supports `prop('NameOrId')` and plain math.js expressions.
 */
export function evalFormula(
  expression: string | undefined,
  ctx: {
    properties?: PropertyMap;
    status?: string;
    defs?: PropertyDef[];
  },
): { ok: true; display: string; value: unknown } | { ok: false; display: string } {
  const expr = (expression || "").trim();
  if (!expr) return { ok: false, display: "—" };

  const props = ctx.properties ?? {};
  const defs = ctx.defs ?? [];
  const byName = new Map(defs.map((d) => [d.name.toLowerCase(), d]));
  const byId = new Map(defs.map((d) => [d.id, d]));

  const resolved = expr.replace(/prop\(\s*['"]([^'"]+)['"]\s*\)/gi, (_m, key: string) => {
    const def = byId.get(key) ?? byName.get(key.toLowerCase());
    let raw: PropertyValue;
    if (def?.id === "status" || key.toLowerCase() === "status") {
      raw = ctx.status ?? props.status;
    } else {
      raw = props[def?.id ?? key];
    }
    if (raw == null || raw === "") return "0";
    if (typeof raw === "boolean") return raw ? "1" : "0";
    if (Array.isArray(raw)) return String(raw.length);
    if (typeof raw === "number") return String(raw);
    const n = Number(raw);
    return Number.isFinite(n) ? String(n) : JSON.stringify(String(raw));
  });

  const result = evaluateMath(resolved);
  if (!result.ok) return { ok: false, display: "…" };
  return { ok: true, display: result.display, value: result.value };
}

/** Aggregate values from related pages for a rollup property. */
export function evalRollup(
  def: PropertyDef,
  related: Array<{ properties?: PropertyMap; status?: string }>,
): string {
  const agg = def.rollupAgg ?? "count";
  if (agg === "count") return String(related.length);

  const nums: number[] = [];
  for (const page of related) {
    const raw =
      def.rollupPropertyId === "status"
        ? page.status
        : page.properties?.[def.rollupPropertyId ?? ""];
    const n = typeof raw === "number" ? raw : Number(raw);
    if (Number.isFinite(n)) nums.push(n);
  }
  if (!nums.length) return "—";
  if (agg === "sum") return String(nums.reduce((a, b) => a + b, 0));
  if (agg === "avg")
    return String(Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100);
  if (agg === "min") return String(Math.min(...nums));
  if (agg === "max") return String(Math.max(...nums));
  return "—";
}

export function formatPropValue(def: PropertyDef, value: PropertyValue): string {
  if (value == null || value === "") return "—";
  if (def.type === "checkbox") return value ? "Yes" : "No";
  if (def.type === "multiSelect" || def.type === "relation") {
    return Array.isArray(value) ? value.join(", ") : String(value);
  }
  if (def.type === "date" && typeof value === "number") {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return String(value);
}

function matchesFilter(
  filter: ViewFilter,
  ctx: {
    properties?: PropertyMap;
    status?: string;
    tags?: string[];
    pinned?: boolean;
    title?: string;
  },
): boolean {
  let raw: PropertyValue;
  if (filter.builtin === "status") raw = ctx.status || "";
  else if (filter.builtin === "tags") raw = ctx.tags ?? [];
  else if (filter.builtin === "pinned") raw = Boolean(ctx.pinned);
  else if (filter.propertyId) raw = ctx.properties?.[filter.propertyId];
  else return true;

  switch (filter.op) {
    case "empty":
      return raw == null || raw === "" || (Array.isArray(raw) && raw.length === 0);
    case "notEmpty":
      return !(raw == null || raw === "" || (Array.isArray(raw) && raw.length === 0));
    case "eq":
      return String(raw ?? "") === String(filter.value ?? "");
    case "neq":
      return String(raw ?? "") !== String(filter.value ?? "");
    case "contains":
      if (Array.isArray(raw))
        return raw.some((t) =>
          String(t).toLowerCase().includes(String(filter.value ?? "").toLowerCase()),
        );
      return String(raw ?? "")
        .toLowerCase()
        .includes(String(filter.value ?? "").toLowerCase());
    case "gt":
      return Number(raw) > Number(filter.value);
    case "lt":
      return Number(raw) < Number(filter.value);
    default:
      return true;
  }
}

export function applyViewConfig<
  T extends {
    title?: string;
    status?: string;
    tags?: string[];
    pinned?: boolean;
    updatedAt?: number;
    properties?: PropertyMap;
  },
>(items: T[], config: ViewConfig | undefined): T[] {
  if (!config) return items;
  let out = items;
  if (config.filters?.length) {
    out = out.filter((item) =>
      config.filters!.every((f) =>
        matchesFilter(f, {
          properties: item.properties,
          status: item.status,
          tags: item.tags,
          pinned: item.pinned,
          title: item.title,
        }),
      ),
    );
  }
  if (config.sorts?.length) {
    const sorts = [...config.sorts];
    out = [...out].sort((a, b) => {
      for (const s of sorts) {
        let av: string | number = "";
        let bv: string | number = "";
        if (s.builtin === "title") {
          av = (a.title || "").toLowerCase();
          bv = (b.title || "").toLowerCase();
        } else if (s.builtin === "updated") {
          av = a.updatedAt ?? 0;
          bv = b.updatedAt ?? 0;
        } else if (s.builtin === "status") {
          av = a.status || "";
          bv = b.status || "";
        } else if (s.builtin === "pinned") {
          av = a.pinned ? 1 : 0;
          bv = b.pinned ? 1 : 0;
        } else if (s.propertyId) {
          const ap = a.properties?.[s.propertyId];
          const bp = b.properties?.[s.propertyId];
          av = Array.isArray(ap) ? ap.join(",") : ((ap as string | number) ?? "");
          bv = Array.isArray(bp) ? bp.join(",") : ((bp as string | number) ?? "");
        }
        if (av < bv) return s.dir === "asc" ? -1 : 1;
        if (av > bv) return s.dir === "asc" ? 1 : -1;
      }
      return 0;
    });
  }
  return out;
}

export function groupByProperty<T extends { status?: string; properties?: PropertyMap }>(
  items: T[],
  groupBy: string | undefined,
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  if (!groupBy) {
    map.set("", items);
    return map;
  }
  for (const item of items) {
    let key = "";
    if (groupBy === "status") key = item.status || "";
    else {
      const v = item.properties?.[groupBy];
      key = Array.isArray(v) ? v.join(",") : String(v ?? "");
    }
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

/** Items whose date property falls on a calendar day (local). */
export function itemsOnDate<T extends { properties?: PropertyMap }>(
  items: T[],
  datePropId: string,
  dayMs: number,
): T[] {
  const start = new Date(dayMs);
  start.setHours(0, 0, 0, 0);
  const end = start.getTime() + 86_400_000;
  const from = start.getTime();
  return items.filter((item) => {
    const raw = item.properties?.[datePropId];
    const ms =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? Date.parse(raw)
          : Number.NaN;
    return Number.isFinite(ms) && ms >= from && ms < end;
  });
}

export type ParsedQuery = {
  status?: string;
  tags: string[];
  props: Array<{ id: string; value: string }>;
  text: string;
};

export function parseQueryString(input: string): ParsedQuery {
  const tags: string[] = [];
  const props: Array<{ id: string; value: string }> = [];
  let status: string | undefined;
  const rest: string[] = [];
  for (const token of input.trim().split(/\s+/).filter(Boolean)) {
    if (token.startsWith("status:")) status = token.slice(7);
    else if (token.startsWith("tag:") || token.startsWith("#")) {
      tags.push(token.replace(/^tag:/, "").replace(/^#/, ""));
    } else if (token.startsWith("prop:")) {
      const body = token.slice(5);
      const [id, ...vv] = body.split("=");
      if (id) props.push({ id, value: vv.join("=") });
    } else rest.push(token);
  }
  return { status, tags, props, text: rest.join(" ") };
}
