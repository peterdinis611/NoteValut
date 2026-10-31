/** Lightweight JSON / YAML / CSV helpers for the Lab transform widget. */

export type DataFormat = "json" | "yaml" | "csv";

export function detectFormat(raw: string): DataFormat {
  const trimmed = raw.trim();
  if (!trimmed) return "json";
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  if (/^[\w."[\]]+\s*,/.test(trimmed) || /\n.*,.*/.test(trimmed)) {
    // Prefer CSV when first line looks like a header row
    const first = trimmed.split(/\r?\n/, 1)[0] ?? "";
    if (first.includes(",") && !first.includes(": ") && !/^[-*]/.test(first)) {
      return "csv";
    }
  }
  return "yaml";
}

export function formatJson(value: unknown, minify: boolean) {
  return minify ? JSON.stringify(value) : JSON.stringify(value, null, 2);
}

export function parseJson(raw: string): unknown {
  return JSON.parse(raw) as unknown;
}

function escapeYamlString(value: string) {
  if (
    value === "" ||
    /[:#{}[\],&*?|<>=!%@`"'\\]/.test(value) ||
    /^\s|\s$/.test(value) ||
    /^(true|false|null|~.)$/i.test(value) ||
    /^-?\d+(\.\d+)?$/.test(value)
  ) {
    return JSON.stringify(value);
  }
  return value;
}

export function toYaml(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") return escapeYamlString(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item) => {
        if (item !== null && typeof item === "object") {
          const body = toYaml(item, indent + 1);
          const lines = body.split("\n").filter(Boolean);
          if (lines.length === 0) return `${pad}- {}`;
          const [first, ...rest] = lines;
          return [`${pad}- ${first!.trimStart()}`, ...rest].join("\n");
        }
        return `${pad}- ${toYaml(item, 0)}`;
      })
      .join("\n");
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    return entries
      .map(([key, val]) => {
        const safeKey = /^[A-Za-z_][\w.-]*$/.test(key)
          ? key
          : JSON.stringify(key);
        if (val !== null && typeof val === "object") {
          const nested = toYaml(val, indent + 1);
          if (nested === "[]" || nested === "{}") {
            return `${pad}${safeKey}: ${nested}`;
          }
          return `${pad}${safeKey}:\n${nested}`;
        }
        return `${pad}${safeKey}: ${toYaml(val, 0)}`;
      })
      .join("\n");
  }
  return escapeYamlString(String(value));
}

function parseYamlScalar(raw: string): unknown {
  const value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    try {
      if (value.startsWith('"')) return JSON.parse(value) as string;
      return value.slice(1, -1);
    } catch {
      return value.slice(1, -1);
    }
  }
  if (value === "null" || value === "~" || value === "") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+$/.test(value)) return Number(value);
  if (/^-?\d+\.\d+$/.test(value)) return Number(value);
  return value;
}

/** Minimal indentation-based YAML (maps/lists/scalars) — lab use, not full YAML 1.2. */
export function parseYaml(text: string): unknown {
  const lines = text
    .replace(/\t/g, "  ")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+#.*$/, ""))
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) return null;

  type Frame = {
    indent: number;
    container: unknown[] | Record<string, unknown>;
    key?: string;
  };

  const root: Record<string, unknown> | unknown[] = lines[0]!.trimStart().startsWith("- ")
    ? []
    : {};
  const stack: Frame[] = [{ indent: -1, container: root }];

  const assign = (frame: Frame, value: unknown) => {
    if (Array.isArray(frame.container)) {
      frame.container.push(value);
      return;
    }
    if (frame.key == null) throw new Error("YAML map entry missing key");
    frame.container[frame.key] = value;
    frame.key = undefined;
  };

  for (const line of lines) {
    const indent = line.match(/^\s*/)?.[0]?.length ?? 0;
    const content = line.trim();

    while (stack.length > 1 && indent <= (stack[stack.length - 1]?.indent ?? 0)) {
      stack.pop();
    }
    const frame = stack[stack.length - 1]!;

    if (content.startsWith("- ")) {
      const rest = content.slice(2).trim();
      if (!Array.isArray(frame.container)) {
        // Convert pending map slot into array if needed
        if (frame.key != null) {
          const arr: unknown[] = [];
          frame.container[frame.key] = arr;
          frame.key = undefined;
          stack.push({ indent, container: arr });
          if (!rest) {
            const obj: Record<string, unknown> = {};
            arr.push(obj);
            stack.push({ indent, container: obj });
          } else if (rest.includes(": ") || rest.endsWith(":")) {
            const obj: Record<string, unknown> = {};
            arr.push(obj);
            const [k, ...vParts] = rest.split(":");
            const v = vParts.join(":").trim();
            if (v === "" && rest.endsWith(":")) {
              stack.push({ indent, container: obj, key: k!.trim() });
            } else {
              obj[k!.trim()] = parseYamlScalar(v);
              stack.push({ indent, container: obj });
            }
          } else {
            arr.push(parseYamlScalar(rest));
          }
          continue;
        }
        throw new Error("YAML list item outside a list");
      }
      if (!rest) {
        const obj: Record<string, unknown> = {};
        frame.container.push(obj);
        stack.push({ indent, container: obj });
      } else if (rest.includes(":") && !rest.startsWith('"')) {
        const obj: Record<string, unknown> = {};
        frame.container.push(obj);
        const idx = rest.indexOf(":");
        const k = rest.slice(0, idx).trim();
        const v = rest.slice(idx + 1).trim();
        if (v === "") {
          stack.push({ indent, container: obj, key: k });
        } else {
          obj[k] = parseYamlScalar(v);
          stack.push({ indent, container: obj });
        }
      } else {
        frame.container.push(parseYamlScalar(rest));
      }
      continue;
    }

    const colon = content.indexOf(":");
    if (colon === -1) {
      throw new Error(`YAML parse error near: ${content}`);
    }
    const key = content.slice(0, colon).trim();
    const valuePart = content.slice(colon + 1).trim();

    if (!Array.isArray(frame.container)) {
      if (valuePart === "") {
        const nextLine = lines[lines.indexOf(line) + 1];
        const nextIndent = nextLine?.match(/^\s*/)?.[0]?.length ?? 0;
        const child: Record<string, unknown> | unknown[] =
          nextLine?.trimStart().startsWith("- ") && nextIndent > indent
            ? []
            : {};
        frame.container[key] = child;
        stack.push({ indent, container: child });
      } else {
        frame.container[key] = parseYamlScalar(valuePart);
      }
    } else {
      assign(frame, { [key]: valuePart === "" ? {} : parseYamlScalar(valuePart) });
    }
  }

  return root;
}

function escapeCsvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    if (value.every((row) => Array.isArray(row))) {
      return (value as unknown[][])
        .map((row) =>
          row.map((cell) => escapeCsvCell(cell == null ? "" : String(cell))).join(","),
        )
        .join("\n");
    }
    if (value.every((row) => row !== null && typeof row === "object" && !Array.isArray(row))) {
      const rows = value as Record<string, unknown>[];
      const keys = Array.from(
        rows.reduce((set, row) => {
          Object.keys(row).forEach((key) => set.add(key));
          return set;
        }, new Set<string>()),
      );
      const header = keys.map(escapeCsvCell).join(",");
      const body = rows
        .map((row) =>
          keys
            .map((key) => escapeCsvCell(row[key] == null ? "" : String(row[key])))
            .join(","),
        )
        .join("\n");
      return `${header}\n${body}`;
    }
    return value.map((cell) => escapeCsvCell(String(cell))).join("\n");
  }
  if (typeof value === "object") {
    return toCsv([value]);
  }
  return escapeCsvCell(String(value));
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

export function parseCsv(text: string): unknown {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line, index, all) => !(index === all.length - 1 && line === ""));
  if (lines.length === 0) return [];
  const rows = lines.map(parseCsvLine);
  const header = rows[0]!;
  const looksLikeHeader =
    header.length > 1 &&
    header.every((cell) => cell.length > 0 && !/^-?\d+(\.\d+)?$/.test(cell));
  if (looksLikeHeader && rows.length > 1) {
    return rows.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      header.forEach((key, index) => {
        obj[key] = row[index] ?? "";
      });
      return obj;
    });
  }
  return rows;
}

export function parseData(raw: string, format: DataFormat): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (format === "json") return parseJson(trimmed);
  if (format === "yaml") return parseYaml(trimmed);
  return parseCsv(trimmed);
}

export function serializeData(
  value: unknown,
  format: DataFormat,
  minify: boolean,
): string {
  if (format === "json") return formatJson(value, minify);
  if (format === "yaml") {
    const yaml = toYaml(value);
    return minify ? yaml.replace(/\n+/g, "\n").trim() : yaml;
  }
  return toCsv(value);
}

/**
 * Tiny JSONPath: `$`, `$.a.b`, `$.items[0]`, `$.items[*].name`
 */
export function queryPath(root: unknown, path: string): unknown {
  const trimmed = path.trim();
  if (!trimmed || trimmed === "$") return root;

  if (!trimmed.startsWith("$")) {
    throw new Error('Path must start with "$"');
  }

  const tokens: Array<string | number | "*"> = [];
  const body = trimmed.slice(1);
  const re = /\.([A-Za-z_][\w]*)|\[(\d+|\*)\]/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body))) {
    if (match.index !== cursor) {
      throw new Error(`Invalid path near: ${body.slice(cursor)}`);
    }
    if (match[1] != null) tokens.push(match[1]);
    else if (match[2] === "*") tokens.push("*");
    else tokens.push(Number(match[2]));
    cursor = re.lastIndex;
  }
  if (cursor !== body.length) {
    throw new Error(`Invalid path near: ${body.slice(cursor)}`);
  }

  const walk = (value: unknown, index: number): unknown => {
    if (index >= tokens.length) return value;
    const token = tokens[index]!;
    if (token === "*") {
      if (!Array.isArray(value)) {
        throw new Error("Wildcard [*] expects an array");
      }
      return value.map((item) => walk(item, index + 1));
    }
    if (typeof token === "number") {
      if (!Array.isArray(value)) {
        throw new Error(`Index [${token}] expects an array`);
      }
      return walk(value[token], index + 1);
    }
    if (value == null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`Cannot read property "${token}"`);
    }
    return walk((value as Record<string, unknown>)[token], index + 1);
  };

  return walk(root, 0);
}
