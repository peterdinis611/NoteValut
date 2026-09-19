/**
 * Syntax highlighting via TanStack Highlight.
 * @see https://tanstack.com/highlight/latest
 */
import { createHighlighter } from "@tanstack/highlight/core";
import { cpp } from "@tanstack/highlight/languages/cpp";
import { css } from "@tanstack/highlight/languages/css";
import { diff } from "@tanstack/highlight/languages/diff";
import { dockerfile } from "@tanstack/highlight/languages/dockerfile";
import { go } from "@tanstack/highlight/languages/go";
import { html } from "@tanstack/highlight/languages/html";
import { js } from "@tanstack/highlight/languages/js";
import { json } from "@tanstack/highlight/languages/json";
import { jsx } from "@tanstack/highlight/languages/jsx";
import { markdown } from "@tanstack/highlight/languages/markdown";
import { mermaid } from "@tanstack/highlight/languages/mermaid";
import { php } from "@tanstack/highlight/languages/php";
import { plaintext } from "@tanstack/highlight/languages/plaintext";
import { python } from "@tanstack/highlight/languages/python";
import { shell } from "@tanstack/highlight/languages/shell";
import { sql } from "@tanstack/highlight/languages/sql";
import { toml } from "@tanstack/highlight/languages/toml";
import { ts } from "@tanstack/highlight/languages/ts";
import { tsx } from "@tanstack/highlight/languages/tsx";
import { yaml } from "@tanstack/highlight/languages/yaml";

const highlighter = createHighlighter({
  fallbackLanguage: "plaintext",
  languages: [
    js,
    ts,
    tsx,
    jsx,
    python,
    go,
    cpp,
    php,
    sql,
    shell,
    json,
    yaml,
    toml,
    html,
    css,
    markdown,
    dockerfile,
    diff,
    mermaid,
    plaintext,
  ],
});

const ALIASES: Record<string, string> = {
  javascript: "js",
  typescript: "ts",
  bash: "shell",
  sh: "shell",
  zsh: "shell",
  yml: "yaml",
  md: "markdown",
  csharp: "cpp",
  "c#": "cpp",
  c: "cpp",
  rust: "plaintext",
  java: "plaintext",
  kotlin: "plaintext",
  swift: "plaintext",
  ruby: "plaintext",
  scss: "css",
  xml: "html",
  graphql: "plaintext",
  auto: "plaintext",
};

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

export const POPULAR_PICKER_IDS = [
  "auto",
  "mermaid",
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

const TANSTACK_LANGS = highlighter.listLanguages();

export const CODE_LANGUAGES: LanguageOption[] = [
  { id: "auto", label: "Auto detect" },
  { id: "mermaid", label: "Mermaid" },
  ...PRIORITY.filter((id) => id !== "plaintext").map((id) => ({
    id,
    label: languageLabel(id),
  })),
  ...TANSTACK_LANGS.filter(
    (id) =>
      !(PRIORITY as readonly string[]).includes(id) &&
      id !== "plaintext" &&
      id !== "mermaid" &&
      !Object.keys(ALIASES).includes(id),
  )
    .sort()
    .map((id) => ({ id, label: languageLabel(id) })),
  { id: "plaintext", label: "Plain text" },
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
    mermaid: "Mermaid",
    js: "JavaScript",
    ts: "TypeScript",
  };
  return map[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

function resolveLang(language?: string): string {
  if (!language || language === "auto") return "plaintext";
  const lower = language.toLowerCase();
  if (ALIASES[lower]) return ALIASES[lower];
  return highlighter.normalizeLanguage(lower) || "plaintext";
}

function guessLanguage(code: string): string {
  const sample = code.slice(0, 400);
  if (/^\s*import\s+.+from\s+['"]/.test(sample) || /:\s*\w+\s*[=;]/.test(sample)) {
    if (/<\/?[A-Z]/.test(sample)) return "tsx";
    return "ts";
  }
  if (/^\s*def\s+\w+|^\s*from\s+\w+\s+import/m.test(sample)) return "python";
  if (/^\s*package\s+main|func\s+\w+\(/.test(sample)) return "go";
  if (/^\s*SELECT\s+|^\s*WITH\s+/i.test(sample)) return "sql";
  if (/^\s*\{[\s\S]*"/.test(sample)) return "json";
  if (/^\s*#\s|^\s*-\s+\w+:/m.test(sample) && /:\s/.test(sample)) return "yaml";
  if (/<\/?[a-zA-Z]/.test(sample)) return "html";
  if (/^\s*(const|let|var|function)\s/.test(sample)) return "js";
  return "plaintext";
}

function toEngineLang(lang: string): string {
  if (lang === "javascript") return "js";
  if (lang === "typescript") return "ts";
  if (lang === "bash") return "shell";
  return resolveLang(lang);
}

function toUiLang(engineLang: string): string {
  if (engineLang === "js") return "javascript";
  if (engineLang === "ts") return "typescript";
  if (engineLang === "shell") return "bash";
  return engineLang;
}

export function highlightCode(code: string, language?: string): { html: string; language: string } {
  const source = code || " ";
  try {
    if (language === "mermaid") {
      return { html: escapeHtml(source), language: "mermaid" };
    }

    const guessed =
      !language || language === "auto" ? guessLanguage(source) : language.toLowerCase();
    const engineLang = toEngineLang(guessed);
    const { html } = highlighter.highlight(source, { lang: engineLang });
    return { html, language: toUiLang(engineLang) };
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
