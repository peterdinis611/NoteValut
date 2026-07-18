import hljs from "highlight.js";

/** Popular languages first, then the full highlight.js catalog. */
export const PRIORITY = [
  "javascript",
  "typescript",
  "tsx",
  "jsx",
  "python",
  "go",
  "rust",
  "java",
  "kotlin",
  "swift",
  "csharp",
  "cpp",
  "c",
  "php",
  "ruby",
  "sql",
  "bash",
  "shell",
  "json",
  "yaml",
  "xml",
  "html",
  "css",
  "scss",
  "markdown",
  "dockerfile",
  "graphql",
  "plaintext",
] as const;

export const POPULAR_LANGUAGE_IDS = new Set<string>(["auto", ...PRIORITY]);

/** Compact popular set shown as chips in the language picker. */
export const POPULAR_PICKER_IDS = [
  "auto",
  "typescript",
  "javascript",
  "python",
  "tsx",
  "go",
  "rust",
  "sql",
  "bash",
  "json",
  "css",
  "plaintext",
] as const;

export type LanguageOption = {
  id: string;
  label: string;
};

export const CODE_LANGUAGES: LanguageOption[] = [
  { id: "auto", label: "Auto detect" },
  ...PRIORITY.filter((id) => id === "plaintext" || hljs.getLanguage(id)).map((id) => ({
    id,
    label: languageLabel(id),
  })),
  ...hljs
    .listLanguages()
    .filter((id) => !(PRIORITY as readonly string[]).includes(id))
    .sort()
    .map((id) => ({ id, label: languageLabel(id) })),
];

function languageLabel(id: string) {
  const map: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    tsx: "TSX",
    jsx: "JSX",
    python: "Python",
    csharp: "C#",
    cpp: "C++",
    bash: "Bash",
    shell: "Shell",
    plaintext: "Plain text",
    dockerfile: "Dockerfile",
    markdown: "Markdown",
    graphql: "GraphQL",
  };
  return map[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

export function highlightCode(code: string, language?: string): { html: string; language: string } {
  const source = code || " ";
  try {
    if (!language || language === "auto") {
      const result = hljs.highlightAuto(source);
      return { html: result.value, language: result.language ?? "plaintext" };
    }
    if (language === "plaintext") {
      return { html: escapeHtml(source), language: "plaintext" };
    }
    if (hljs.getLanguage(language)) {
      return {
        html: hljs.highlight(source, { language, ignoreIllegals: true }).value,
        language,
      };
    }
    const result = hljs.highlightAuto(source);
    return { html: result.value, language: result.language ?? "plaintext" };
  } catch {
    return { html: escapeHtml(source), language: language ?? "plaintext" };
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
