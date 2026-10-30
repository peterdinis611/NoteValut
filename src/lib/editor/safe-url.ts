const UNSAFE_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

/**
 * URL-safe slug from human text (titles, headings).
 * Keeps latin letters/digits; strips control chars and collapses separators.
 */
export function toSafeSlug(value: string, maxLength = 72): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");

  return slug || "untitled";
}

/** Absolute vault deep-link that is safe to share / paste. */
export function toSafePageUrl(input: {
  noteId: string;
  title: string;
  origin?: string;
}): string {
  const origin =
    input.origin ??
    (typeof window !== "undefined" ? window.location.origin : "");
  const slug = toSafeSlug(input.title);
  const url = new URL("/vault", origin || "http://localhost");
  url.searchParams.set("page", input.noteId);
  url.searchParams.set("slug", slug);
  return url.toString();
}

/**
 * Normalize user-provided hrefs for TipTap links.
 * Rejects dangerous protocols; adds https:// when missing a scheme.
 */
export function toSafeHref(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("#") || trimmed.startsWith("/")) return trimmed;
  if (UNSAFE_PROTOCOLS.test(trimmed)) return null;

  try {
    const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
