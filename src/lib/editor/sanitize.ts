import sanitizeHtml from "sanitize-html";
import { toSafeHref } from "./safe-url";

/** TipTap / NoteValut editor allowlist. */
const EDITOR_ALLOWED_TAGS = [
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "mark",
  "a",
  "img",
  "hr",
  "span",
  "div",
  "label",
  "input",
] as const;

const EDITOR_ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "name", "target", "rel", "class"],
  img: ["src", "alt", "title", "width", "height", "class"],
  mark: ["class"],
  code: ["class"],
  pre: ["class"],
  p: ["class"],
  h1: ["class"],
  h2: ["class"],
  h3: ["class"],
  ul: ["data-type", "class"],
  ol: ["class"],
  li: ["data-type", "data-checked", "class"],
  span: ["class"],
  div: ["class"],
  label: ["class"],
  input: ["type", "checked", "disabled"],
  "*": ["class"],
};

const shared: sanitizeHtml.IOptions = {
  allowedTags: [...EDITOR_ALLOWED_TAGS],
  allowedAttributes: EDITOR_ALLOWED_ATTRIBUTES,
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    img: ["http", "https"],
    a: ["http", "https", "mailto"],
  },
  allowProtocolRelative: false,
  // Drop inline event handlers / style XSS vectors.
  allowedStyles: {},
  disallowedTagsMode: "discard",
  transformTags: {
    a: (tagName, attribs) => {
      const href = toSafeHref(attribs.href ?? "");
      if (!href) {
        return {
          tagName: "span",
          attribs: {},
        };
      }
      return {
        tagName,
        attribs: {
          href,
          class: attribs.class ?? "nv-editor-link",
          rel: "noopener noreferrer nofollow",
          ...(attribs.target === "_blank" ? { target: "_blank" } : {}),
        },
      };
    },
    img: (tagName, attribs) => {
      const src = toSafeHref(attribs.src ?? "");
      if (!src) {
        return {
          tagName: "span",
          attribs: {},
          text: attribs.alt ? String(attribs.alt) : "",
        };
      }
      return {
        tagName,
        attribs: {
          src,
          alt: attribs.alt ?? "",
          class: attribs.class ?? "nv-editor-image",
          ...(attribs.title ? { title: attribs.title } : {}),
          ...(attribs.width ? { width: attribs.width } : {}),
          ...(attribs.height ? { height: attribs.height } : {}),
        },
      };
    },
    input: (tagName, attribs) => {
      if (attribs.type && attribs.type !== "checkbox") {
        return { tagName: "span", attribs: {} };
      }
      return {
        tagName,
        attribs: {
          type: "checkbox",
          disabled: "disabled",
          ...(attribs.checked != null ? { checked: "checked" } : {}),
        },
      };
    },
  },
};

/**
 * Sanitize TipTap HTML before load/save.
 * Strips scripts, event handlers, unsafe URLs, and unknown tags.
 */
export function sanitizeEditorHtml(html: string): string {
  const raw = html ?? "";
  if (!raw.trim()) return "<p></p>";
  const cleaned = sanitizeHtml(raw, shared).trim();
  return cleaned || "<p></p>";
}

/**
 * Stricter pass for outbound email HTML (no forms/inputs).
 */
export function sanitizeEmailHtml(html: string): string {
  const raw = html ?? "";
  if (!raw.trim()) return "<p><em>(Empty page)</em></p>";

  const cleaned = sanitizeHtml(raw, {
    ...shared,
    allowedTags: EDITOR_ALLOWED_TAGS.filter(
      (tag) => tag !== "input" && tag !== "label",
    ),
    exclusiveFilter: (frame) =>
      frame.tag === "input" || frame.tag === "label",
  }).trim();

  return cleaned || "<p><em>(Empty page)</em></p>";
}
