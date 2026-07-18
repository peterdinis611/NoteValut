export type InlineFormat = "bold" | "italic" | "code" | "highlight";

const WRAP: Record<InlineFormat, [string, string]> = {
  bold: ["**", "**"],
  italic: ["*", "*"],
  code: ["`", "`"],
  highlight: ["==", "=="],
};

/** Wrap a textarea selection with markdown-style markers. */
export function wrapSelection(
  value: string,
  start: number,
  end: number,
  format: InlineFormat,
): { text: string; selectionStart: number; selectionEnd: number } {
  const [open, close] = WRAP[format];
  const selected = value.slice(start, end);
  if (start === end) {
    const insertion = `${open}${close}`;
    const text = value.slice(0, start) + insertion + value.slice(end);
    const caret = start + open.length;
    return { text, selectionStart: caret, selectionEnd: caret };
  }
  // Unwrap if already wrapped
  if (
    selected.startsWith(open) &&
    selected.endsWith(close) &&
    selected.length >= open.length + close.length
  ) {
    const inner = selected.slice(open.length, selected.length - close.length);
    const text = value.slice(0, start) + inner + value.slice(end);
    return {
      text,
      selectionStart: start,
      selectionEnd: start + inner.length,
    };
  }
  const wrapped = `${open}${selected}${close}`;
  const text = value.slice(0, start) + wrapped + value.slice(end);
  return {
    text,
    selectionStart: start,
    selectionEnd: start + wrapped.length,
  };
}

export type InlineSegment =
  | { type: "text"; value: string }
  | { type: "bold" | "italic" | "code" | "highlight"; value: string };

/** Parse a subset of markdown inline marks for display. */
export function parseInlineSegments(input: string): InlineSegment[] {
  if (!input) return [{ type: "text", value: "" }];
  const pattern =
    /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|==([^=]+)==)/g;
  const segments: InlineSegment[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(input))) {
    if (match.index > last) {
      segments.push({ type: "text", value: input.slice(last, match.index) });
    }
    if (match[2] !== undefined) segments.push({ type: "bold", value: match[2] });
    else if (match[3] !== undefined) segments.push({ type: "italic", value: match[3] });
    else if (match[4] !== undefined) segments.push({ type: "code", value: match[4] });
    else if (match[5] !== undefined) segments.push({ type: "highlight", value: match[5] });
    last = match.index + match[0].length;
  }
  if (last < input.length) {
    segments.push({ type: "text", value: input.slice(last) });
  }
  return segments.length ? segments : [{ type: "text", value: input }];
}

/** Strip inline markers for search / plain preview. */
export function stripInlineMarks(input: string): string {
  return input
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/==([^=]+)==/g, "$1");
}
